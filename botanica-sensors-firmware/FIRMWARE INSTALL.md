Botanica Wellness Custom Firmware (BWS)
===============

Introduction
-------------------

These instructions will help you to set up your development environment, get the source code of the Botanica Wellness for your specific device and build it by yourself. 

      Note: The firmware is tested and developed on LILYGO T-Higrow module which is based on the ESP32 microchip

Prerequisites
-------------------

Before you begin, ensure you have the following:

* [VS Code](https://code.visualstudio.com/) installed on your system.
* [PlatformIO IDE](https://platformio.org)extension installed in VS Code.
* A supported device.
* Basic knowledge of C/C++ programming.


Setup
-------------------

1. Install PlatformIO Extension: Open VS Code and navigate to the Extensions view. Search for "PlatformIO IDE" and install it.
2. Create a New Project: In VS Code, open the Command Palette (Ctrl+Shift+P on Windows/Linux, Cmd+Shift+P on macOS) and select "PlatformIO: New Project". Follow the prompts to set up your project, including selecting the board (to your choice of the supported bords) and framework (Arduino, ESP-IDF, etc.).
3. Get the code: Locate the firmware supported by your device at "botanica-sensors-firmware/the name of your device".
4. PlatformIO Configuration: Review the platformio.ini file in your project directory. This file contains configuration settings such as the target board, upload speed, and additional libraries. Ensure that the settings match your module/device and project requirements.
5. Build and Upload: Before you upload anything you will need to build a file system image and then upload that image to the device. Use the PlatformIO Toolbar in VS Code to build and upload your file system image to the ESP32 board. Click on the corresponding icons to compile and upload the firmware. Alternatively, you can use the Command Palette and select PlatformIO commands. 
6. Enjoy!

Contributing
-------------

Contributions to this project are welcome! If you find any issues or have suggestions for improvements, please feel free to open an issue or submit a pull request on GitHub.

License
-------------

Botanica Wellness is distributed under the GNU General Public License GPLv3 or higher, see [LICENSE](https://www.gnu.org/licenses/gpl-3.0.en.html) for details.

---
