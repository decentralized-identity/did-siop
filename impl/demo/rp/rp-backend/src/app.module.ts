import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LibDidSiopModule } from '@app/lib-did-siop';
import { SiopController } from './siop/siop.controller';
import { SiopModule } from './siop/siop.module';
import { WalletModule } from './wallet/wallet.module';
import { SiopProcessor } from './siop/siop.processor';


@Module({
  imports: [LibDidSiopModule, SiopModule, WalletModule],
  controllers: [AppController, SiopController],
  providers: [AppService, SiopProcessor],
})
export class AppModule {}
