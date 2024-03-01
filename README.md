
<h1 align="center">
  <br>
 <img src="https://www.botanica-wellness.com/pics/logo/logo_svg.svg" alt="Botanica" width="200">
  <br>
    Botanica Wellness (Flowers At Home v2)
  <br>
</h1>

<h4 align="center">Open-Source IoT based smart plant monitoring system</h4>


## Key Features

* IoT-based monitoring system for epidemic disease control: a key precision agriculture application for domestic and commercial use
  
* Hardware sensors generic enough from multiple vendors to be used with multiple plant diseases. All of them supporting ultra-low power modes and have long life battery cycles.

  
* Reduces the number of chemical fungicides applications and promotes agriculture products with no (or minimal) chemicals residues and high-quality crops.

  
* Realize an expert system that emulates the decision-making ability of a human expert

## Introduction

Precision Agriculture (PA) has recently become the main trend in global agriculture. PA aims at optimizing production efficiency and uniformity across the field, optimizing the quality of the crops, minimizing the environmental impact, and minimizing the risk both from income and environmental points of view. One of the main applications of PA that is based on environmental auditing is epidemic disease control. Epidemic diseases have severe impacts on the crop production. The key player in epidemic diseases is the climate changes that occur unexpectedly in time and space, which make their impact more severe.

The Internet of Things (IoT) has recently been considered the state-of-the-art in implementing distributed monitoring and control systems in various application areas. Our IoT-based monitoring system aims to use Wireless Sensor Network (WSN) technology and is accessible through the Internet for precision agriculture applications such as epidemic disease control. Our IoT-based plant disease management system aims to achieve sustainable agricultural development. This system is generic enough to be used with multiple plant diseases where the software architecture can handle different plant disease models. In addition, the sensors and developed expert system software are flexible to be used with different plants in the monitored fields or other precision agriculture applications. While our platform is based on a standard wireless communication layer, it involves a careful system design, since the platform requirements are very strict.

### The main components of the system are: 
* Botanica Cloud IoT Server
* Botanica firmware for hardware sensors
* Botanica application for:  
  * Android mobile devices
  * iOS mobile devices (under development)
  * Web application (under development)



## Download

You can [download](https://github.com/amitmerchant1990/electron-markdownify/releases/tag/v1.2.0) the latest installable version of Botanica-Wellnes for Android.

## Botanica Cloud IoT Server

The Botanica Cloud IoT Server design is an independent software module that is not affected by the types, number and accuracy of hardware sensors used in the intelligent monitoring system. The developed software collects and analyzes all the values and gives a reasonable estimate of the actual treatment of various plant disease patterns by taking into account the sensor data and accuracy information. In addition, the software is flexible for use with different plants in monitored fields and is designed to be independent of a specific disease pattern. The software module is planned to consist of two components: a system core component and an artificial intelligence (AI) component. The core of the system takes care of collecting all the sensor data, and the AI component processes and analyzes the sensor readings and sends alarms if necessary to protect the user's crops. Botanica Cloud IoT Server supports multiple users and multiple sensors per user. At the moment there is no limitation.

You can see the server system requierments [here](https://github.com/ivan-iliev/Flowers-At-Home-2.0/blob/main/botanica-core-server/SERVER.md).



## Device Firmware

The software design and implementation of firmware for a hardware plant sensor built as part of the integrated monitoring system for plant disease monitor and forecasting. All hardware sensors from multiple vendors have to be generic enough and to support: Soil fertility detection, Soil moisture detection, Light intensity detection, Ambient air temperature, Ambient air humidity, Low power working mode, Ultra Low power sleep, Long life battery cycle support. The plant sensor senses these quantities at a programmable period and sends the sensors’ readings as JSON data to the Botanica Cloud IoT Server.

### Current releases of botanica firmware for hardware sensors;
* [LILIGO Model T-Higrow](https://www.lilygo.cc/en-bg/products/t-higrow)


## Andorid app client

The Botanica application is an independent software module for Android mobile devices, built as part of the integrated monitoring system for plant disease monitor and forecasting. The software product has been developed to facilitate the users of the system by providing them with mobility and the possibility of remote configuration, monitoring of sensor data, and notification. The application will help the gardening process to be realized more effectively, which increases revenue. By collecting various data parameters to the cloud server and enabling remote control through a mobile application, the IoT-based intelligent system has been proven to work reliably. The software is designed and can:
* be easily installed and updated on the most common mobile devices based on the Android operating system
* create, edit, or delete a user profile in the Botanica Cloud IoT Server 
* create, edit, or delete unlimited user profiles of plants with the best conditions for their cultivation
* add, edit, or delete unlimited wireless hardware sensors from different vendors
* online monitoring and immediate notification(under development) if the values reported by the sensors do not correspond to the defined profiles of the installation
* history and graphic charts

### Using a mobile application is one of the best practices for agricultural activity that uses the least amount of time and helps prevent crop damage by not over- or under-irrigating
the soil. Through an Android app, the farm owner monitors the entire cultivation process online.

## Roadmap

- [x] Mobile Android Client
- [ ] Cross-platform Mobile Client
    - [ ] IOS/Web  
- [ ] Support on different device models (custom devices)
- [ ] Integrate AI module in the server-side
- [ ] Multi-language Support 


## License

 Botanica Wellness is distributed under the GNU General Public License GPLv3 or higher, see [LICENSE](https://www.gnu.org/licenses/gpl-3.0.en.html) for details.

---

> GitHub [@ivan-iliev](https://github.com/ivan-iliev) &nbsp;&middot;&nbsp;


