import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrafficService } from '../../services/traffic.service';
import { NetworkClient } from '../../models/traffic.models';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {

  totalDownload: number = 0;
  totalUpload: number = 0;
  connectedClients: number = 0;
  topTalker: string = '';

  constructor(private trafficService: TrafficService) {}

  ngOnInit(): void {
    this.fetchTraffic();
    // Atualiza a cada 5s
    setInterval(() => this.fetchTraffic(), 5000);
  }

  private fetchTraffic(): void {
    this.trafficService.getClients().subscribe((clients: NetworkClient[]) => {
      this.connectedClients = clients.length;

      // Soma total de download e upload
      this.totalDownload = clients.reduce((sum, c) => sum + c.downloadValue, 0);
      this.totalUpload = clients.reduce((sum, c) => sum + c.uploadValue, 0);

      // Top talker = maior tráfego (download + upload)
      const top = clients.sort((a, b) =>
        (b.downloadValue + b.uploadValue) - (a.downloadValue + a.uploadValue)
      )[0];

      this.topTalker = top ? top.ip : 'N/A';
    });
  }
}
