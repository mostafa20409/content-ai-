// components/BookWizard.tsx
"use client";

import React, { useState } from 'react';
import { BookGenerationData, DesignCustomization, BookChapter } from '../types/book';

interface BookWizardProps {
  designOptions: any;
  bookTypes: Record<string, string>;
  onSubmit: (data: BookGenerationData) => void;
  onCancel: () => void;
}

const BookWizard: React.FC<BookWizardProps> = ({ designOptions, bookTypes, onSubmit, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [bookData, setBookData] = useState<BookGenerationData>({
    title: '',
    description: '',
    language: 'ar',
    bookType: 'LITERARY',
    chapters: [],
    includeExamples: true,
    generateCover: false,
    researchDepth: 'advanced',
    authorStyle: 'professional',
    authorName: ''
  });

  const [designCustomization, setDesignCustomization] = useState<DesignCustomization>(
    designOptions?.defaultDesign || {
      authorName: '',
      coverLayout: 'modern',
      colorScheme: {
        primary: '#2C3E50',
        secondary: '#34495E',
        accent: '#E74C3C',
        background: '#FFFFFF',
        text: '#2C3E50'
      },
      typography: {
        fontFamily: 'Traditional',
        titleSize: '2.5rem',
        authorSize: '1.5rem'
      },
      includeAuthorOnCover: true,
      customGraphics: [],
      coverImageStyle: 'abstract'
    }
  );

  // إضافة فصل جديد
  const addChapter = () => {
    const newChapter: BookChapter = {
      chapterNumber: bookData.chapters.length + 1,
      title: '',
      description: ''
    };
    setBookData(prev => ({
      ...prev,
      chapters: [...prev.chapters, newChapter]
    }));
  };

  // تحديث بيانات الفصل
  const updateChapter = (index: number, field: keyof BookChapter, value: string) => {
    setBookData(prev => ({
      ...prev,
      chapters: prev.chapters.map((chapter, i) =>
        i === index ? { ...chapter, [field]: value } : chapter
      )
    }));
  };

  // حذف فصل
  const removeChapter = (index: number) => {
    setBookData(prev => ({
      ...prev,
      chapters: prev.chapters.filter((_, i) => i !== index)
    }));
  };

  // التقديم النهائي
  const handleSubmit = () => {
    if (bookData.generateCover) {
      onSubmit({
        ...bookData,
        designOptions: designCustomization
      });
    } else {
      onSubmit(bookData);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* خطوات التقدم */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          {[1, 2, 3, 4].map(step => (
            <div key={step} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep >= step
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                {step}
              </div>
              {step < 4 && (
                <div
                  className={`w-16 h-1 mx-2 ${
                    currentStep > step ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        
        <div className="flex justify-between text-sm text-gray-600">
          <span>معلومات الكتاب</span>
          <span>الفصول</span>
          <span>خيارات متقدمة</span>
          <span>المراجعة</span>
        </div>
      </div>

      {/* الخطوة 1: معلومات أساسية */}
      {currentStep === 1 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6">المعلومات الأساسية للكتاب</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                عنوان الكتاب
              </label>
              <input
                type="text"
                value={bookData.title}
                onChange={(e) => setBookData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="أدخل عنوان الكتاب"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نوع الكتاب
              </label>
              <select
                value={bookData.bookType}
                onChange={(e) => setBookData(prev => ({ ...prev, bookType: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {bookTypes && Object.entries(bookTypes).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                وصف الكتاب
              </label>
              <textarea
                value={bookData.description}
                onChange={(e) => setBookData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="اكتب وصفًا مفصلاً للكتاب..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اللغة
              </label>
              <select
                value={bookData.language}
                onChange={(e) => setBookData(prev => ({ ...prev, language: e.target.value as 'ar' | 'en' }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ar">العربية</option>
                <option value="en">English</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                أسلوب الكتابة
              </label>
              <select
                value={bookData.authorStyle}
                onChange={(e) => setBookData(prev => ({ ...prev, authorStyle: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="professional">احترافي</option>
                <option value="academic">أكاديمي</option>
                <option value="creative">إبداعي</option>
                <option value="conversational">حميمي</option>
                <option value="formal">رسمي</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between mt-8">
            <button
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              إلغاء
            </button>
            <button
              onClick={() => setCurrentStep(2)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              التالي
            </button>
          </div>
        </div>
      )}

      {/* الخطوة 2: إدارة الفصول */}
      {currentStep === 2 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6">إدارة فصول الكتاب</h2>
          
          <div className="mb-6">
            <button
              onClick={addChapter}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              + إضافة فصل
            </button>
          </div>

          {bookData.chapters.map((chapter, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">الفصل {chapter.chapterNumber}</h3>
                {bookData.chapters.length > 1 && (
                  <button
                    onClick={() => removeChapter(index)}
                    className="text-red-600 hover:text-red-800 transition-colors"
                  >
                    حذف
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    عنوان الفصل
                  </label>
                  <input
                    type="text"
                    value={chapter.title}
                    onChange={(e) => updateChapter(index, 'title', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="عنوان الفصل"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    وصف الفصل
                  </label>
                  <textarea
                    value={chapter.description}
                    onChange={(e) => updateChapter(index, 'description', e.target.value)}
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="وصف مختصر لمحتوى الفصل..."
                  />
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-between mt-8">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              السابق
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              disabled={bookData.chapters.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              التالي
            </button>
          </div>
        </div>
      )}

      {/* الخطوة 3: خيارات متقدمة */}
      {currentStep === 3 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6">خيارات متقدمة</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={bookData.includeExamples}
                onChange={(e) => setBookData(prev => ({ ...prev, includeExamples: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label className="ml-2 text-sm font-medium text-gray-700">
                تضمين أمثلة واقعية من البحوث
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                مستوى البحث
              </label>
              <select
                value={bookData.researchDepth}
                onChange={(e) => setBookData(prev => ({ ...prev, researchDepth: e.target.value as 'basic' | 'advanced' | 'academic' }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="basic">أساسي</option>
                <option value="advanced">متقدم</option>
                <option value="academic">أكاديمي</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={bookData.generateCover}
                onChange={(e) => setBookData(prev => ({ ...prev, generateCover: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label className="ml-2 text-sm font-medium text-gray-700">
                إنشاء غلاف للكتاب
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اسم المؤلف
              </label>
              <input
                type="text"
                value={bookData.authorName}
                onChange={(e) => setBookData(prev => ({ ...prev, authorName: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="اسم المؤلف"
              />
            </div>
          </div>

          {bookData.generateCover && (
            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-semibold mb-4">تخصيص الغلاف</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    نمط الغلاف
                  </label>
                  <select
                    value={designCustomization.coverLayout}
                    onChange={(e) => setDesignCustomization(prev => ({ ...prev, coverLayout: e.target.value as any }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {designOptions?.layoutOptions?.map((option: string) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    نمط الصورة
                  </label>
                  <select
                    value={designCustomization.coverImageStyle}
                    onChange={(e) => setDesignCustomization(prev => ({ ...prev, coverImageStyle: e.target.value as any }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {designOptions?.styleOptions?.map((option: string) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={designCustomization.includeAuthorOnCover}
                    onChange={(e) => setDesignCustomization(prev => ({ ...prev, includeAuthorOnCover: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label className="ml-2 text-sm font-medium text-gray-700">
                    عرض اسم المؤلف على الغلاف
                  </label>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-8">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              السابق
            </button>
            <button
              onClick={() => setCurrentStep(4)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              التالي
            </button>
          </div>
        </div>
      )}

      {/* الخطوة 4: المراجعة النهائية */}
      {currentStep === 4 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6">مراجعة المعلومات</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold mb-2">معلومات الكتاب</h3>
              <p><strong>العنوان:</strong> {bookData.title}</p>
              <p><strong>النوع:</strong> {bookTypes?.[bookData.bookType]}</p>
              <p><strong>اللغة:</strong> {bookData.language === 'ar' ? 'العربية' : 'English'}</p>
              <p><strong>الأسلوب:</strong> {bookData.authorStyle}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">الفصول</h3>
              <p><strong>عدد الفصول:</strong> {bookData.chapters.length}</p>
              <div className="max-h-40 overflow-y-auto">
                {bookData.chapters.map((chapter, index) => (
                  <div key={index} className="mb-2 p-2 bg-gray-50 rounded">
                    <p className="text-sm"><strong>الفصل {chapter.chapterNumber}:</strong> {chapter.title}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold mb-2">الخيارات المتقدمة</h3>
            <p><strong>الأمثلة الواقعية:</strong> {bookData.includeExamples ? 'نعم' : 'لا'}</p>
            <p><strong>مستوى البحث:</strong> {bookData.researchDepth}</p>
            <p><strong>إنشاء الغلاف:</strong> {bookData.generateCover ? 'نعم' : 'لا'}</p>
            {bookData.generateCover && (
              <p><strong>نمط الغلاف:</strong> {designCustomization.coverLayout}</p>
            )}
          </div>

          <div className="flex justify-between mt-8">
            <button
              onClick={() => setCurrentStep(3)}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              السابق
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              بدء الإنشاء
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookWizard;