// models/Analysis.ts
import mongoose, { Document, Schema } from 'mongoose';

// واجهة لنموذج التحليل
export interface IAnalysis extends Document {
  input: string; // النص المدخل للتحليل
  result: {
    trend: string; // اتجاه السوق (صاعد/هابط/مستقر)
    recommendation: string; // التوصية (شراء/بيع/احتفاظ)
    confidence: number; // درجة الثقة في التحليل (0-1)
    additionalData?: any; // بيانات إضافية
  };
  language: string; // لغة التحليل (ar/en)
  userId?: mongoose.Types.ObjectId; // ID المستخدم (اختياري)
  createdAt: Date; // تاريخ الإنشاء
  updatedAt: Date; // تاريخ التحديث
}

// مخطط نموذج التحليل
const AnalysisSchema: Schema = new Schema(
  {
    input: {
      type: String,
      required: [true, 'نص التحليل مطلوب'],
      trim: true,
      maxlength: [5000, 'نص التحليل لا يمكن أن يتجاوز 5000 حرف']
    },
    result: {
      trend: {
        type: String,
        required: [true, 'اتجاه السوق مطلوب'],
        enum: {
          values: ['صاعد', 'هابط', 'مستقر', 'upward', 'downward', 'stable'],
          message: 'اتجاه السوق غير صالح'
        }
      },
      recommendation: {
        type: String,
        required: [true, 'التوصية مطلوبة'],
        enum: {
          values: ['شراء', 'بيع', 'احتفاظ', 'buy', 'sell', 'hold'],
          message: 'التوصية غير صالحة'
        }
      },
      confidence: {
        type: Number,
        required: [true, 'درجة الثقة مطلوبة'],
        min: [0, 'درجة الثقة لا يمكن أن تكون أقل من 0'],
        max: [1, 'درجة الثقة لا يمكن أن تتجاوز 1']
      },
      additionalData: {
        type: Schema.Types.Mixed,
        default: {}
      }
    },
    language: {
      type: String,
      required: [true, 'اللغة مطلوبة'],
      enum: {
        values: ['ar', 'en'],
        message: 'اللغة غير مدعومة'
      },
      default: 'ar'
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User', // ربط بجدول المستخدمين
      required: false
    }
  },
  {
    timestamps: true // إضافة createdAt و updatedAt تلقائياً
  }
);

// فهارس لتحسين أداء الاستعلامات
AnalysisSchema.index({ userId: 1, createdAt: -1 });
AnalysisSchema.index({ language: 1 });
AnalysisSchema.index({ 'result.trend': 1 });
AnalysisSchema.index({ 'result.recommendation': 1 });

// Middleware قبل الحفظ
AnalysisSchema.pre<IAnalysis>('save', function(next) {
  // تنظيف البيانات قبل الحفظ
  this.input = this.input.trim();
  next();
});

// دوال مساعدة للنموذج
AnalysisSchema.methods = {
  // دالة للحصول على ملخص التحليل
  getSummary: function(): string {
    const lang = this.language;
    if (lang === 'ar') {
      return `اتجاه ${this.result.trend} مع توصية ${this.result.recommendation} (ثقة: ${Math.round(this.result.confidence * 100)}%)`;
    } else {
      return `${this.result.trend} trend with ${this.result.recommendation} recommendation (confidence: ${Math.round(this.result.confidence * 100)}%)`;
    }
  },
  
  // دالة للتحقق من جودة التحليل
  isHighConfidence: function(): boolean {
    return this.result.confidence >= 0.7;
  }
};

// دالة ثابتة للنموذج
AnalysisSchema.statics = {
  // البحث عن التحليلات حسب المستخدم
  findByUser: function(userId: string) {
    return this.find({ userId }).sort({ createdAt: -1 });
  },
  
  // الحصول على إحصائيات التحليلات
  getStats: async function(userId?: string) {
    const matchStage: any = {};
    if (userId) {
      matchStage.userId = new mongoose.Types.ObjectId(userId);
    }
    
    return this.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalAnalyses: { $sum: 1 },
          avgConfidence: { $avg: '$result.confidence' },
          buyRecommendations: {
            $sum: {
              $cond: [
                { $in: ['$result.recommendation', ['شراء', 'buy']] },
                1,
                0
              ]
            }
          },
          sellRecommendations: {
            $sum: {
              $cond: [
                { $in: ['$result.recommendation', ['بيع', 'sell']] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);
  }
};

// تصدير النموذج
export default mongoose.models.Analysis || mongoose.model<IAnalysis>('Analysis', AnalysisSchema);