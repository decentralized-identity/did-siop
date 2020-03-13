import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LibDidSiopModule } from '@app/lib-did-siop';
import { SiopController } from './siop/siop.controller';
import { SiopService } from './siop/siop.service';
import { SiopModule } from './siop/siop.module';
import { WalletModule } from './wallet/wallet.module';


@Module({
  imports: [LibDidSiopModule, SiopModule, WalletModule],
  controllers: [AppController, SiopController],
  providers: [AppService, SiopService],
})
export class AppModule {}
