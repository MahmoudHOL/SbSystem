/**
 * مسارات تكامل واتساب (Baileys)
 */

const express = require('express');
const authController = require('../controllers/authController');
const whatsappClient = require('../whatsapp/client');

const router = express.Router();

// جميع المسارات محمية بتسجيل الدخول
router.use(authController.requireAuth);

// 1) جلب QR الحالي + حالة الاتصال
router.get('/api/whatsapp/qr', async (req, res) => {
  try {
    const info = await whatsappClient.getQr();
    res.json({ success: true, data: info });
  } catch (err) {
    console.error('WhatsApp QR error:', err);
    res.status(500).json({ success: false, message: 'خطأ في جلب QR' });
  }
});

// 2) إرسال رسالة نصية
router.post('/api/whatsapp/send-text', async (req, res) => {
  const { to, text } = req.body || {};
  if (!to || !text) {
    return res.status(400).json({ success: false, message: 'رقم المستلم والنص مطلوبان' });
  }
  try {
    await whatsappClient.sendText(to, text);
    res.json({ success: true, message: 'تم إرسال الرسالة' });
  } catch (err) {
    console.error('WhatsApp send-text error:', err);
    res.status(500).json({ success: false, message: err.message || 'فشل إرسال الرسالة' });
  }
});

// 3) إرسال ملف (رابط)
router.post('/api/whatsapp/send-file', async (req, res) => {
  const { to, url, caption } = req.body || {};
  if (!to || !url) {
    return res.status(400).json({ success: false, message: 'رقم المستلم ورابط الملف مطلوبان' });
  }
  try {
    await whatsappClient.sendFile(to, url, caption);
    res.json({ success: true, message: 'تم إرسال الملف' });
  } catch (err) {
    console.error('WhatsApp send-file error:', err);
    res.status(500).json({ success: false, message: err.message || 'فشل إرسال الملف' });
  }
});

// 4) حالة الاتصال
router.get('/api/whatsapp/status', async (req, res) => {
  try {
    const info = await whatsappClient.getStatus();
    res.json({ success: true, data: info });
  } catch (err) {
    console.error('WhatsApp status error:', err);
    res.status(500).json({ success: false, message: 'خطأ في جلب الحالة' });
  }
});

// 5) مسح auth وإعادة بدء الجلسة (جلب QR جديد)
router.post('/api/whatsapp/reset-auth', async (req, res) => {
  try {
    const info = await whatsappClient.resetAuth();
    res.json({ success: true, message: 'تم مسح بيانات الاتصال. امسح QR جديد من واجهة النظام.', data: info });
  } catch (err) {
    console.error('WhatsApp reset-auth error:', err);
    res.status(500).json({ success: false, message: 'خطأ في إعادة تهيئة الاتصال' });
  }
});

module.exports = router;

