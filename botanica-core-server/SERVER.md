Botanica Wellness Server (BWS)
===============

Thank you for your interest in Botanica Wellness Server, an open-source software used for PA and plants monitoring.
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

      Note: Actual configuration depends on the number of active items and refresh rates very much. It is highly recommended to run the database on a separate box for large installations.


**Required software**

BWS is built around modern web servers, leading database engines, and PHP scripting language.

**Third-party external surrounding software**


|  Software |  Supported versions   |  Comments |
| ------ | ------ | ------ |
|  PostgreSQL  |  15.X  |  Depending on the installation size, it might be required to increase PostgreSQL work_mem configuration property (4MB being the default value), so that the amount of memory used by the database for particular operation is sufficient and query execution does not take too much time.  |
|  Nginx |  1.22 or later  |  It is reqired to set "**underscores_in_headers on;**" in server configuration. Depending on uploaded pictures size, it may be required to increase client_max_body_size configuration property (2MB being the default value). E.q.  "**client_max_body_size 18M;**". '**add_header Cache-Control "no-store";**' and '**add_header Expires 0;**' are reqired on /pics location.|
|  PHP   |  8.2.X | '**short_open_tag = On**' is required. '**session.gc_maxlifetime = 86400**' is reqired. Depending on uploaded pictures size, it may be required to increase memory_limit (128M default), upload_max_filesize (8M default) and post_max_size (16M default). E.q. "**memory_limit =256M**", "**upload_max_filesize =18M**", "**post_max_size =28M**"   |
|  PHP extensions:|
|  pgsql |
|  pdo  |  

**Time synchronization**

It is very important to have precise system time on the server with BWS running. ntpd is the most popular daemon that synchronizes the host's time with the time of other machines. It's strongly recommended to maintain synchronized system time on all systems Botanica Wellness components are running on.

**Network requirements**

A following list of open ports per component is applicable for default configuration.


| Port | Components |
| ------ | ------ |
|  BWS | http on 80, https on 443   |

**Note:** _The port numbers should be opened in the firewall to enable external communications with BWS. Outgoing TCP connections usually do not require explicit firewall settings._


Resolving Common Issues
--------------------------------

None know at the moment.

License
---------

**FIX ME:**
Botanica Wellness Server is distributed under the GNU General Public License GPLv3 or
higher, see [LICENSE](LICENSE) for details.

