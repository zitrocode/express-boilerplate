import httpStatus from 'http-status';
import { getStatusMessage } from 'http-status-message';

const httpMessage = (statusCode: number = httpStatus.INTERNAL_SERVER_ERROR): string => {
  const { message } = getStatusMessage(statusCode, 'formal');
  return message;
};

export default httpMessage;
