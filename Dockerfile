FROM trzeci/emscripten
RUN apt update \
&& apt upgrade -y \
&& apt install bison re2c -y
WORKDIR /src
