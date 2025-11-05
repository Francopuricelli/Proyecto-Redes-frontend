import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegistroComponent } from './components/registro/registro.component';
import { PublicacionesComponent } from './components/publicaciones/publicaciones.component';
import { MiPerfilComponent } from './components/perfil/mi-perfil.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegistroComponent },
  { path: 'publicaciones', component: PublicacionesComponent, canActivate: [AuthGuard] },
  { path: 'perfil', component: MiPerfilComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '/login' }
];
