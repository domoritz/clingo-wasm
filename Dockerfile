FROM trzeci/emscripten
WORKDIR /deps
RUN apt-get update \
&& apt-get upgrade -y \
&& apt-get install bison re2c -y \
# Fetch and compile Lua
&& lua=lua-5.3.4 \
&& wget https://www.lua.org/ftp/$lua.tar.gz \
&& tar -xf $lua.tar.gz \
&& mv $lua /deps/lua \
&& cd /deps/lua \
&& emmake make generic local CC='emcc -s WASM=1'
WORKDIR /src