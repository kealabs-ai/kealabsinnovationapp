export interface PdfSection {
    title: string;
    rows: {
        label: string;
        value: string;
        bold?: boolean;
    }[];
    subtotal?: {
        label: string;
        value: string;
    };
}
export interface PdfHostingRow {
    label: string;
    spec: string;
    price: string;
}
export interface PdfPayload {
    clientName: string;
    clientEmail?: string;
    clientCpfCnpj?: string;
    clientPhone?: string;
    sections: PdfSection[];
    hosting?: PdfHostingRow[];
    setupValue: string;
    clientCharge: string;
    installments: number;
    installmentValue: string;
    totalCharge: string;
    liquidMensal: string;
    liquidAntecipado: string;
    mdrInfo: string;
    date: string;
}
export declare function generateProposalPdf(payload: PdfPayload): Promise<Buffer>;
//# sourceMappingURL=pdf.service.d.ts.map