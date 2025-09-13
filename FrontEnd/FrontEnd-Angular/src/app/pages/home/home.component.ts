import { Component } from '@angular/core';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { FooterComponent } from '../../components/footer/footer.component'; 
import { MainChartComponent } from '../../components/main-chart/main-chart.component';

@Component({
  selector: 'app-home',
  standalone: true, 
  imports: [SidebarComponent],
  imports: [SidebarComponent,
      FooterComponent,
      MainChartComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent { 

}