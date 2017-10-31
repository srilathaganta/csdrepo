import { WebContentPage } from './app.po';

describe('web-content App', function() {
  let page: WebContentPage;

  beforeEach(() => {
    page = new WebContentPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
