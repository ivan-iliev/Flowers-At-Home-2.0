Botanica Wellness Server (BWS)
===============

**FIX THIS**: Thank you for your interest in Botanica Wellness Server, a professional software used to
play out and record professional graphics, audio and video to multiple outputs.
CasparCG Server has been in 24/7 broadcast production since 2024.

The Botanica Wellness Server works on Linux.

System Requirements
-------------------

**Hardware**

**Memory**
Botanica Wellness Server requires both physical and disk memory. The amount of required disk memory obviously depends on the number of hosts and parameters that are being monitored. If you're planning to keep a long history of monitored parameters, you should be thinking of at least a couple of gigabytes to have enough space to store the history in the database.

      Note: The more physical memory you have, the faster the database (and therefore BWS) works.

**CPU**

BWS and especially Botanica Wellness database may require significant CPU resources depending on number of monitored parameters.

**Examples of hardware configuration**

The table provides examples of hardware configuration.

These are size and hardware configuration examples to start with. Each BWS installation is unique. Make sure to benchmark the performance of your Botanica Wellness system in a staging or development environment, so that you can fully understand your requirements before deploying the BWS installation to its production environment.

| Installation size	 | Monitored metrics | CPU/vCPU cores	 | Memory (GiB) | Amazon EC2	 |
| ------ | ------ | ------ | ------ | ------ |
|  Small |  1 000 |  2  |  8  |  m6i.large/m6g.large  |
|  Medium   |  10 000   |  4  |  16 |  m6i.xlarge/m6g.xlarge   |
|  Large |  100 000  |  16 |  64 |  m6i.4xlarge/m6g.4xlarge |
|  Very large  |  1 000 000   |  32 |  96 |  m6i.8xlarge/m6g.8xlarge |

_Example with Amazon general purpose EC2 instances, using ARM64 or x86_64 architecture, a proper instance type like Compute/Memory/Storage optimised should be selected during BWS installation evaluation and testing before installing in its production environment._

      Note: Actual configuration depends on the number of active items and refresh rates very much (see database size section of this page for details). It is highly recommended to run the database on a separate box for large installations.

- A graphics card (GPU) capable of OpenGL 4.5 is required.
- An Nvidia GPU is recommended, but other GPU's will likely work fine.
- Only Intel CPU's have been tested and are known to work

**Required software**

BWS is built around modern web servers, leading database engines, and PHP scripting language.

**Third-party external surrounding software**


|  Software |  Supported versions   |  Comments |
| ------ | ------ | ------ |
|  PostgreSQL  |  15.X  |  Depending on the installation size, it might be required to increase PostgreSQL work_mem configuration property (4MB being the default value), so that the amount of memory used by the database for particular operation is sufficient and query execution does not take too much time.  |
|  Nginx |  1.22 or later  |  It is reqired to set "**underscores_in_headers on;**" in server configuration. Depending on uploaded pictures size, it may be required to increase client_max_body_size configuration property (2MB being the default value). E.q.  "**client_max_body_size 18M;**". '**add_header Cache-Control "no-store";**' and '**add_header Expires 0;**' are reqired on /pics location.|
|  PHP   |  8.2.X | '**short_open_tag = On**' is required. Depending on uploaded pictures size, it may be required to increase memory_limit (128M default), upload_max_filesize (8M default) and post_max_size (16M default). E.q. "**memory_limit =256M**", "**upload_max_filesize =18M**", "**post_max_size =28M**"   |
|  PHP extensions:|
|  pgsql |      
### Windows

 - Only Windows 10 is supported

### Linux

 - Ubuntu 20.04 and 22.04 are supported

Getting Started
---------------

1. Download a release from (http://casparcg.com/downloads).
   Alternatively, newer testing versions can be downloaded from (http://builds.casparcg.com) or [built from source](BUILDING.md)

2. Install any optional non-GPL modules
    - Flash template support (Windows only):

    1. Uninstall any previous version of the Adobe Flash Player using this file:
        (http://download.macromedia.com/get/flashplayer/current/support/uninstall_flash_player.exe)

    2. Download and unpack
        (http://download.macromedia.com/pub/flashplayer/installers/archive/fp_11.8.800.94_archive.zip)

    3. Install Adobe Flash Player 11.8.800.94 from the unpacked archive:
        fp_11.8.800.94_archive\11_8_r800_94\flashplayer11_8r800_94_winax.exe

3. Configure the server by editing the self-documented "casparcg.config" file in
   a text editor.

4.
   1. Windows: start `casparcg_auto_restart.bat`, or `casparcg.exe` and `scanner.exe` separately.
   1. Linux: start the `run.sh` program or use tools/linux/start_docker.sh to run within docker (documentation is at the top of the file).

5. Connect to the Server from a client software, such as the "CasparCG Client"
   which is available as a separate download.

Documentation
-------------

The most up-to-date documentation is always available at
https://github.com/CasparCG/help/wiki

Ask questions in the forum: https://casparcgforum.org/

Resolving Common Issues On Linux
--------------------------------

Common problems you may encounter when running on newer and unsupported
Ubuntu editions:

1. HTML producer freezes and/or throws "Fontconfig error" message
Add below line to run.sh script:
export FONTCONFIG_PATH=/etc/fonts

2. HTML producer throws "GTK theme error" message
Install gnome-themes-standard package:
sudo apt install gnome-themes-standard

3. Error while loading libgcrypt.so.11
Extract libgcrypt.so.11 and libgcrypt.so.11.8.2 to CasparCG lib/ directory.
You can get it from:
https://launchpad.net/ubuntu/+archive/primary/+files/libgcrypt11_1.5.3-2ubuntu4.2_amd64.deb

4. Error while loading libcgmanager.so.0
Install central cgroup manager daemon (client library):
sudo apt install libcgmanager0

5. Error while loading shared libraries: libgconf-2.so.4
Install GNOME configuration database system:
sudo apt -y install libgconf2-4

6. lib/libz.so.1: version `ZLIB_1.2.9' not found
cd your_casparcg_directory/lib/
sudo mv libz.so.1 libz.so.1.old
sudo ln -s /lib/x86_64-linux-gnu/libz.so.1

Development
-----------

See [BUILDING](BUILDING.md) for instructions on how to build the CasparCG Server from source manually.

License
---------

CasparCG Server is distributed under the GNU General Public License GPLv3 or
higher, see [LICENSE](LICENSE) for details.

CasparCG Server uses the following third party libraries:
- FFmpeg (http://ffmpeg.org/) under the GPLv2 Licence.
  FFmpeg is a trademark of Fabrice Bellard, originator of the FFmpeg project.
- Threading Building Blocks (http://www.threadingbuildingblocks.org/) library under the GPLv2 Licence.
- FreeImage (http://freeimage.sourceforge.net/) under the GPLv2 License.
- SFML (http://www.sfml-dev.org/) under the zlib/libpng License.
- GLEW (http://glew.sourceforge.net) under the modified BSD License.
- boost (http://www.boost.org/) under the Boost Software License, version 1.0.
