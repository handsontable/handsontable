import { AppComponent } from './app.component';

describe('AppComponent', () => {
  it('should create the app', () => {
    const app = new AppComponent();
    expect(app).toBeTruthy();
  });

  it('should expose initialData with rows', () => {
    const app = new AppComponent();
    expect(app.initialData.length).toBeGreaterThan(0);
  });

  it('should expose gridSettings with colHeaders', () => {
    const app = new AppComponent();
    expect(Array.isArray(app.gridSettings.colHeaders)).toBeTrue();
  });
});
