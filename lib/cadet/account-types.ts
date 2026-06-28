export type CadetAccountRecord = {
  id: number;
  memberId: number;
  bankName: string;
  accountNumber: number;
  duitNowId: number | null;
  qrCodePath: string | null;
  qrCodeUrl: string | null;
  createdAt: string;
  updatedAt: string;
};
