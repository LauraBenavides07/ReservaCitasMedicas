import { AllExceptionsFilter } from './all-exceptions.filter';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let mockJson: jest.Mock;
  let mockResponse: any;
  let mockHost: any;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    mockJson = jest.fn();
    mockResponse = {
      status: jest.fn().mockReturnValue({ json: mockJson }),
    };
    mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
      }),
    };
  });

  it('debería capturar HttpException y devolver el status correcto', () => {
    const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);
    filter.catch(exception, mockHost);
    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.NOT_FOUND,
        message: ['Not Found'],
        timestamp: expect.any(String),
      }),
    );
  });

  it('debería capturar HttpException con response object', () => {
    const exception = new HttpException(
      { message: ['Campo requerido', 'Formato inválido'] },
      HttpStatus.BAD_REQUEST,
    );
    filter.catch(exception, mockHost);
    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        message: ['Campo requerido', 'Formato inválido'],
      }),
    );
  });

  it('debería capturar errores no HTTP como Internal Server Error', () => {
    const exception = new Error('Algo salió mal');
    filter.catch(exception, mockHost);
    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        message: ['Error interno del servidor'],
      }),
    );
  });

  it('debería devolver timestamp ISO', () => {
    const exception = new HttpException('Error', HttpStatus.BAD_REQUEST);
    filter.catch(exception, mockHost);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      }),
    );
  });
});
