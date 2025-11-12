import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegistroComponent } from './components/registro/registro.component';
import { PublicacionesComponent } from './components/publicaciones/publicaciones.component';
import { MiPerfilComponent } from './components/perfil/mi-perfil.component';
import { DetallePublicacionComponent } from './components/detalle-publicacion/detalle-publicacion.component';
import { DashboardUsuariosComponent } from './components/dashboard-usuarios/dashboard-usuarios.component';
import { DashboardEstadisticasComponent } from './components/dashboard-estadisticas/dashboard-estadisticas.component';
import { AuthGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegistroComponent },
  { path: 'publicaciones', component: PublicacionesComponent, canActivate: [AuthGuard] },
  { path: 'publicaciones/:id', component: DetallePublicacionComponent, canActivate: [AuthGuard] },
  { path: 'perfil', component: MiPerfilComponent, canActivate: [AuthGuard] },
  { path: 'admin/usuarios', component: DashboardUsuariosComponent, canActivate: [AuthGuard, adminGuard] },
  { path: 'admin/estadisticas', component: DashboardEstadisticasComponent, canActivate: [AuthGuard, adminGuard] },
  { path: '**', redirectTo: '/login' }
];
