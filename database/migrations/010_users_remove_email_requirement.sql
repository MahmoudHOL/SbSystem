-- جعل البريد الإلكتروني اختيارياً (إزالته من واجهة المستخدمين)
ALTER TABLE users MODIFY COLUMN email VARCHAR(255) NULL;
ALTER TABLE users DROP INDEX uk_users_email;
