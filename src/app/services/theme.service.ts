import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private darkModeSubject = new BehaviorSubject<boolean>(false);
  public darkMode$ = this.darkModeSubject.asObservable();
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    
    if (this.isBrowser) {
      const savedTheme = this.loadThemePreference();
      this.darkModeSubject.next(savedTheme);
      this.applyTheme(savedTheme);
    }
  }

  private loadThemePreference(): boolean {
    if (!this.isBrowser) return false;
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  }

  private saveThemePreference(isDark: boolean): void {
    if (!this.isBrowser) return;
    localStorage.setItem('darkMode', JSON.stringify(isDark));
  }

  private applyTheme(isDark: boolean): void {
    if (!this.isBrowser) return;
    if (isDark) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }

  toggleDarkMode(): void {
    const newValue = !this.darkModeSubject.value;
    this.darkModeSubject.next(newValue);
    this.saveThemePreference(newValue);
    this.applyTheme(newValue);
  }

  isDarkMode(): boolean {
    return this.darkModeSubject.value;
  }
}
