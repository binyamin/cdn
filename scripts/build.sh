curl -fsSL https://deno.land/x/install/install.sh | sh
export DENO_INSTALL="/opt/buildhome/.deno"
export PATH="$DENO_INSTAL/bin:$PATH"
deno task build
