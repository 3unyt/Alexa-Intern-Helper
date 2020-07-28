const nodemailer = require('nodemailer');
const notificationStrings = require('./notificationStrings');
module.exports = Object.freeze({
  sendEmailNotification
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'zhzhutesting@gmail.com',
    pass: 'cockcock'
  }
});

function sendEmailNotification(notificationType, userInfo){

  const mailOptions = {
    from: 'zhzhutesting@gmail.com',
    to: notificationStrings[`STRING_${notificationType}`].Receiver,
    subject: notificationStrings[`STRING_${notificationType}`].Subject,
    text: notificationStrings[`STRING_${notificationType}`].Body
    .replace(/{{userName}}/g, userInfo.userName)
    .replace(/{{emailAddress}}/g, userInfo.emailAddress)
  };

  transporter.sendMail(mailOptions, function(error, info){
    if (error){
      console.log(error);
    }else{
      console.log('Email sent:' + info.response);
    }
  });
}
