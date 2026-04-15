import type { FastifyRequest, FastifyReply } from 'fastify';
import type { CreateQuoteDTO } from '../types';
export declare class BuilderController {
    create(req: FastifyRequest<{
        Body: CreateQuoteDTO;
    }>, reply: FastifyReply): Promise<never>;
    list(_req: FastifyRequest, reply: FastifyReply): Promise<never>;
    findOne(req: FastifyRequest<{
        Params: {
            id: string;
        };
    }>, reply: FastifyReply): Promise<never>;
    geminiPayload(req: FastifyRequest<{
        Params: {
            id: string;
        };
    }>, reply: FastifyReply): Promise<never>;
    asaasPayload(req: FastifyRequest<{
        Params: {
            id: string;
        };
    }>, reply: FastifyReply): Promise<never>;
    updateStatus(req: FastifyRequest<{
        Params: {
            id: string;
        };
        Body: {
            status: 'PENDING' | 'APPROVED' | 'REJECTED';
            description?: string;
        };
    }>, reply: FastifyReply): Promise<never>;
    clearStore(_req: FastifyRequest, reply: FastifyReply): Promise<never>;
}
export declare const builderController: BuilderController;
//# sourceMappingURL=builder.controller.d.ts.map