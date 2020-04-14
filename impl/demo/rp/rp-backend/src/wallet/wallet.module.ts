import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';

@Module({
  // providers: [WalletService.Instance],
  exports: [WalletService]
})
export class WalletModule {}
