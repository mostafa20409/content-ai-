// src/components/AccountManagement.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiUser, FiCreditCard, FiShield, FiBell, FiGlobe, FiSave, FiEdit, FiArrowLeft } from 'react-icons/fi';

export default function AccountManagement() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
    language: 'ar',
    notifications: true,
    twoFactor: false
  });
  const [subscription] = useState({
    plan: 'مجاني',
    status: 'نشط',
    nextBilling: '2024-12-01',
    usage: {
      content: 5,
      contentLimit: 10,
      books: 2,
      booksLimit: 3,
      ads: 3,
      adsLimit: 5
    }
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // جلب بيانات المستخدم الحقيقية من API
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/account');
        const data = await response.json();
        
        if (response.ok) {
          setUserData({
            name: data.account.name || '',
            email: data.account.email || '',
            phone: data.account.phone || '',
            language: data.account.language || 'ar',
            notifications: data.account.notifications !== false,
            twoFactor: data.account.twoFactor || false
          });
        } else {
          console.error('Error fetching user data:', data.error);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  const handleSave = async () => {
    try {
      const response = await fetch('/api/account', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();
      
      if (response.ok) {
        setIsEditing(false);
        alert('تم حفظ التغييرات بنجاح');
      } else {
        console.error('Error saving data:', data.error);
        alert('حدث خطأ أثناء حفظ البيانات');
      }
    } catch (error) {
      console.error('Error saving data:', error);
      alert('حدث خطأ أثناء حفظ البيانات');
    }
  };

  const handleUpgrade = () => {
    router.push('/upgrade');
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <button 
        onClick={() => router.back()}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '20px',
          padding: '8px 16px',
          background: 'transparent',
          border: '1px solid #ddd',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        <FiArrowLeft /> العودة للوحة التحكم
      </button>

      <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '24px' }}>إدارة الحساب</h1>

      <div style={{ display: 'flex', gap: '24px', flexDirection: 'row' }}>
        {/* القائمة الجانبية */}
        <div style={{ width: '250px', flexShrink: 0 }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }}>
            <button
              onClick={() => setActiveTab('profile')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '12px',
                background: activeTab === 'profile' ? 'rgba(124,58,237,0.1)' : 'transparent',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                color: activeTab === 'profile' ? '#7C3AED' : '#333',
                marginBottom: '8px'
              }}
            >
              <FiUser size={18} />
              <span>الملف الشخصي</span>
            </button>

            <button
              onClick={() => setActiveTab('subscription')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '12px',
                background: activeTab === 'subscription' ? 'rgba(124,58,237,0.1)' : 'transparent',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                color: activeTab === 'subscription' ? '#7C3AED' : '#333',
                marginBottom: '8px'
              }}
            >
              <FiCreditCard size={18} />
              <span>الاشتراك</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '12px',
                background: activeTab === 'security' ? 'rgba(124,58,237,0.1)' : 'transparent',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                color: activeTab === 'security' ? '#7C3AED' : '#333',
                marginBottom: '8px'
              }}
            >
              <FiShield size={18} />
              <span>الأمان</span>
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '12px',
                background: activeTab === 'notifications' ? 'rgba(124,58,237,0.1)' : 'transparent',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                color: activeTab === 'notifications' ? '#7C3AED' : '#333',
                marginBottom: '8px'
              }}
            >
              <FiBell size={18} />
              <span>الإشعارات</span>
            </button>

            <button
              onClick={() => setActiveTab('preferences')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '12px',
                background: activeTab === 'preferences' ? 'rgba(124,58,237,0.1)' : 'transparent',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                color: activeTab === 'preferences' ? '#7C3AED' : '#333'
              }}
            >
              <FiGlobe size={18} />
              <span>التفضيلات</span>
            </button>
          </div>
        </div>

        {/* المحتوى الرئيسي */}
        <div style={{ flex: 1 }}>
          {activeTab === 'profile' && (
            <div style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>الملف الشخصي</h2>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      background: 'transparent',
                      border: '1px solid #7C3AED',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      color: '#7C3AED'
                    }}
                  >
                    <FiEdit size={16} />
                    <span>تعديل</span>
                  </button>
                ) : (
                  <button
                    onClick={handleSave}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      background: '#7C3AED',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      color: 'white'
                    }}
                  >
                    <FiSave size={16} />
                    <span>حفظ</span>
                  </button>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>الاسم</label>
                  <input
                    type="text"
                    value={userData.name}
                    onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                    disabled={!isEditing}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      background: !isEditing ? '#f9fafb' : 'white'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={userData.email}
                    onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                    disabled={!isEditing}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid ',
                      borderRadius: '8px',
                      background: !isEditing ? '#f9fafb' : 'white'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>رقم الهاتف</label>
                  <input
                    type="tel"
                    value={userData.phone}
                    onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                    disabled={!isEditing}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      background: !isEditing ? '#f9fafb' : 'white'
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'subscription' && (
            <div style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px', margin: 0 }}>خطة الاشتراك</h2>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '20px',
                background: 'linear-gradient(135deg, #7C3AED, #60A5FA)',
                borderRadius: '12px',
                color: 'white',
                marginBottom: '24px'
              }}>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: '700' }}>{subscription.plan}</div>
                  <div style={{ opacity: 0.9 }}>حالة الاشتراك: {subscription.status}</div>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '14px', opacity: 0.9 }}>تاريخ التجديد القادم</div>
                  <div style={{ fontSize: '16px', fontWeight: '600' }}>{subscription.nextBilling}</div>
                </div>
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>استخدامك الحالي</h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <div style={{
                  padding: '16px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#7C3AED' }}>
                    {subscription.usage.content} / {subscription.usage.contentLimit}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>المحتوى</div>
                </div>

                <div style={{
                  padding: '16px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#60A5FA' }}>
                    {subscription.usage.books} / {subscription.usage.booksLimit}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>الكتب</div>
                </div>

                <div style={{
                  padding: '16px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#10B981' }}>
                    {subscription.usage.ads} / {subscription.usage.adsLimit}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>الإعلانات</div>
                </div>
              </div>

              <button
                onClick={handleUpgrade}
                style={{
                  padding: '12px 24px',
                  background: '#F59E0B',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                ترقية الخطة
              </button>
            </div>
          )}

          {activeTab === 'security' && (
            <div style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px', margin: 0 }}>الأمان</h2>
              
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ marginBottom: '12px' }}>المصادقة الثنائية</h3>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>تمكين المصادقة الثنائية</span>
                  <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '24px' }}>
                    <input type="checkbox" checked={userData.twoFactor} onChange={() => setUserData({...userData, twoFactor: !userData.twoFactor})} style={{ opacity: 0, width: 0, height: 0 }} />
                    <span style={{
                      position: 'absolute',
                      cursor: 'pointer',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: userData.twoFactor ? '#10B981' : '#ccc',
                      transition: '.4s',
                      borderRadius: '24px'
                    }}>
                      <span style={{
                        position: 'absolute',
                        height: '18px',
                        width: '18px',
                        left: userData.twoFactor ? '26px' : '3px',
                        bottom: '3px',
                        backgroundColor: 'white',
                        transition: '.4s',
                        borderRadius: '50%'
                      }} />
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <h3 style={{ marginBottom: '12px' }}>جلسات النشطة</h3>
                <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span>هذه الجلسة</span>
                    <span style={{ color: '#10B981', fontWeight: '600' }}>نشطة</span>
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>متصفح: Chrome على Windows</div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>آخر نشاط: منذ 5 دقائق</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px', margin: 0 }}>الإشعارات</h2>
              
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ marginBottom: '12px' }}>تفضيلات الإشعارات</h3>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span>تمكين الإشعارات</span>
                  <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '24px' }}>
                    <input type="checkbox" checked={userData.notifications} onChange={() => setUserData({...userData, notifications: !userData.notifications})} style={{ opacity: 0, width: 0, height: 0 }} />
                    <span style={{
                      position: 'absolute',
                      cursor: 'pointer',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: userData.notifications ? '#10B981' : '#ccc',
                      transition: '.4s',
                      borderRadius: '24px'
                    }}>
                      <span style={{
                        position: 'absolute',
                        height: '18px',
                        width: '18px',
                        left: userData.notifications ? '26px' : '3px',
                        bottom: '3px',
                        backgroundColor: 'white',
                        transition: '.4s',
                        borderRadius: '50%'
                      }} />
                    </span>
                  </label>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span>إشعارات البريد الإلكتروني</span>
                  <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '24px' }}>
                    <input type="checkbox" checked={true} style={{ opacity: 0, width: 0, height: 0 }} />
                    <span style={{
                      position: 'absolute',
                      cursor: 'pointer',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: '#10B981',
                      transition: '.4s',
                      borderRadius: '24px'
                    }}>
                      <span style={{
                        position: 'absolute',
                        height: '18px',
                        width: '18px',
                        left: '26px',
                        bottom: '3px',
                        backgroundColor: 'white',
                        transition: '.4s',
                        borderRadius: '50%'
                      }} />
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px', margin: 0 }}>التفضيلات</h2>
              
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ marginBottom: '12px' }}>اللغة</h3>
                <select
                  value={userData.language}
                  onChange={(e) => setUserData({...userData, language: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}
                >
                  <option value="ar">العربية</option>
                  <option value="en">English</option>
                </select>
              </div>

              <div>
                <h3 style={{ marginBottom: '12px' }}>المظهر</h3>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    flex: 1
                  }}>
                    <div style={{ width: '40px', height: '40px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '4px', margin: '0 auto 8px' }}></div>
                    <span>فاتح</span>
                  </div>
                  <div style={{
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    flex: 1
                  }}>
                    <div style={{ width: '40px', height: '40px', background: '#1e293b', border: '1px solid #334155', borderRadius: '4px', margin: '0 auto 8px' }}></div>
                    <span>داكن</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}