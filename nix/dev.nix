{ project ? import ./. {}
}:
let
  common = import ./common.nix {};
  node = import ./node.nix {};
in with project.pkgs; common ++ node
