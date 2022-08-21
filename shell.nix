{projectName ? (baseNameOf ./.)}:
let
  pkgs = import ./nix {};
  devPkgs = import nix/dev.nix {};
in
  pkgs.mkShell {
    buildInputs = devPkgs;
    shellHook = ''
        set +ex
        if ! [ -f ".env" ]; then
          echo "WARNING: No .env file, will copy .env.example"
          cp .env.example .env
        else
          echo "Load .env"
          set -o allexport; source .env; set +o allexport
        fi
        echo "Welcome to ${projectName} nix shell"
    '';
  }
