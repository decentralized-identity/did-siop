import { WalletService } from './wallet.service';

describe('WalletService', () => {

  it('should be defined', () => {
    expect(WalletService.Instance).toBeDefined();
  });
});
