import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import axios from 'axios';
import { WebhookService } from './webhook/webhook.service';
import { RequestWithUser } from './auth/types';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, T> {
  constructor(private readonly webhookService: WebhookService) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<T> {
    return next.handle().pipe(
      tap(async (data) => {
        const httpContext = context.switchToHttp();
        const request = httpContext.getRequest<RequestWithUser>();
        if (request.user) {
          const method = request.method;
          const webhook = await this.webhookService.findByBounceRoute(
            request.url,
            request.user.id,
          );
          if (webhook) {
            const url = webhook.targetUrl;
            try {
              let response;
              switch (method) {
                case 'GET':
                  response = await axios.get(url);
                  break;
                case 'POST':
                  response = await axios.post(url, data);
                  break;
                case 'PUT':
                  response = await axios.put(url, data);
                  break;
                case 'DELETE':
                  response = await axios.delete(url);
                  break;
                case 'PATCH':
                  response = await axios.patch(url, data);
                  break;
                default:
                  console.log(`Método HTTP no soportado: ${method}`);
              }
              if (response) {
                console.log('Respuesta del webhook:', response.data);
              }
            } catch (error) {
              console.error('Error al hacer la solicitud con axios:', error);
            }
          }
        }
      }),
    );
  }
}
