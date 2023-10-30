# Installation
Library `mylib` can be installed from github.

## Installation from github.
Execute the following commands to install `mylib` from github.

This will install the `mylib` library into `/opt/mycomp/mylib/` with a symbolic link for the include directory to `/opt/mycomp/include/mylib`.
The installation may require root priviliges when directory `/opt/mycomp/` does not exist.

```
$ git clone https://github.com/mycomp/mylib.git /tmp/mylib
$ chmod +x /tmp/mylib/install
$ /tmp/mylib/install
```