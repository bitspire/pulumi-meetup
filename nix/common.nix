{ project ? import ./. {}
}:

with project.pkgs; [
      curl
      git
      niv
      pulumi-bin
  ]
