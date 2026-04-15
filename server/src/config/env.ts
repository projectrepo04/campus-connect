import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const env = {
    port: parseInt(process.env.PORT || '5000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    collegeEmailDomain: process.env.COLLEGE_EMAIL_DOMAIN || 'college.edu',
    rollNumberPattern: process.env.ROLL_NUMBER_PATTERN || '^[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{3}$',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
};
