import { Resend } from 'resend';
import { createLoggerFor } from '../loggers/loggers.js';
import CustomError from '../../utils/CustomError.js';

const ResendAPiKey = process.env.RESEND_API_KEY;
const logger = createLoggerFor(import.meta.url, 'verifyEmail');

const resend = new Resend(ResendAPiKey);
const clientURL = process.env.CLIENT_URL;

async function sendMail({ email, token }) {
  let link = `${clientURL}/verifyemail?token=${token}`;
  // sub is currently fine to add for it but in future i would want email construction as refers to subject
  logger.info('sending email...');
  const { data, error } = await resend.emails.send({
    from: 'PinPic <onboarding@resend.dev>',
    to: email,
    subject: 'Verify Your Email Id',
    html: `<strong> well here is the link for your verification: ${link} </strong>`,
  });
  if (error) {
    logger.error(`Error while sending verification email : ${error.message}`);
    throw new CustomError(
      'error while sending email...',
      500,
      'INTERNAL_SERVER_ERROR'
    );
  }
  logger.info(`verification Email sent: ${data}`);
  return;
}
export default sendMail;
