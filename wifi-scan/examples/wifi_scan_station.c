/*
 * wifi-scan-station example for wifi-scan library
 *
 * Copyright (C) 2016 Bartosz Meglicki <meglickib@gmail.com>
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 * This program is distributed "as is" WITHOUT ANY WARRANTY of any
 * kind, whether express or implied; without even the implied warranty
 * of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 */

/*
 *  This example retrieves information only from associated AP (Access Point).
 *  wifi_scan_station function may be called at high frequency without affectining the link
 *  
 *  The signal strength retrieved comes from last received PPDU (physical layer protocol data unit).
 *  You may want to average the value over some reads.
 * 
 *  Program expects wireless interface as argument, e.g:
 *  wifi-scan-station wlan0
 * 
 */

#include "../wifi_scan.h"
#include <stdio.h>  //printf

int main(int argc, char **argv) {
    struct wifi_scan *wifi = NULL;    //this stores all the library information
    struct station_info station;    //this is where we are going to keep information about AP (Access Point) we are connected to
    int status;

    // initialize the library with network interface argv[1] (e.g. wlan0)
    wifi = wifi_scan_init(argv[1]);

    //get information from just the station we are associated with
    //this is quick, you can call it at much faster frequency (e.g. 50 ms)
    status = wifi_scan_station(wifi, &station);

    if (status == 0)
        printf("No associated station\n");
    else if (status == -1)
        perror("Unable to get station information\n");
    else
        printf("%d", station.signal_dbm);

    //free the library resources
    wifi_scan_close(wifi);

    return 0;
}
