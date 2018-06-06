import { Observable } from 'rxjs';
import slack from './index';

describe('Slack', () => {
  const mockUser = { user: { profile: { email: 'email' } } };
  const mockHttp = () => ({
    getJson: () => Observable.of(mockUser),
  });
  const { getUserEmailForId } = slack(mockHttp);

  describe('getUserEmailForId', () => {
    it('should get user email', () => {
      expect.assertions(1);
      getUserEmailForId('userID')
        .then(res => expect(res).toEqual('email'));
    });
  });
});
