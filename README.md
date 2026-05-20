# conver_lang · SB Smart

تطبيق Node.js لصفحة تسجيل الدخول مع Intro واتصال بقاعدة MySQL **sb_pos**.

## هيكل المجلدات

```
conver_lang/
├── config/          # إعدادات (قاعدة البيانات، الجلسة)
├── controllers/     # منطق تسجيل الدخول
├── database/        # schema.sql لإنشاء sb_pos وجدول users
├── public/          # واجهة المستخدم
│   ├── css/         # تنسيق صفحة الدخول
│   ├── js/          # سكربت الدخول والـ Intro
│   └── video/       # وضع ملف intro.mp4 (أو نسخ x.mp4 هنا)
├── routes/          # مسارات التطبيق (auth, dashboard)
├── scripts/         # سكربتات مساعدة (مثل seed-user)
├── server.js        # نقطة التشغيل
└── .env.example     # مثال لمتغيرات البيئة
```

## الإعداد

1. **إنشاء قاعدة البيانات وجدول users**

   من MySQL (أو phpMyAdmin):

   ```bash
   mysql -u root -p < database/schema.sql
   ```

   أو نفّذ محتوى `database/schema.sql` يدوياً.

2. **نسخ إعدادات البيئة**

   ```bash
   copy .env.example .env
   ```

   ثم عدّل `.env` (مثلاً `DB_USER`, `DB_PASSWORD`, `DB_NAME=sb_pos`).

3. **الفيديو Intro**

   ضع ملف الـ Intro في `public/video/intro.mp4` (يمكنك نسخ `x.mp4` من جذر المشروع وتسميته `intro.mp4`).

4. **تثبيت الحزم وتشغيل التطبيق**

   ```bash
   npm install
   node scripts/seed-user.js   # إنشاء مستخدم تجريبي: admin / admin123
   npm start
   ```

   ثم افتح: `http://localhost:3000/login`

## المستخدم التجريبي

بعد تشغيل `node scripts/seed-user.js`:

- **اسم المستخدم:** admin  
- **كلمة المرور:** admin123  

## الألوان والهوية

صفحة الدخول تستخدم ألوان SB Smart كما في الهوية البصرية:

- خلفية داكنة (#0d0d0d)
- لمسات نحاسية/ذهبية (#b87333, #c9a86c)
- تأثير توهج خفيف على العناوين والأزرار
