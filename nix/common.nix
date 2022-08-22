{ project ? import ./. {}
}:

with project.pkgs; [
      curl
      git
      niv
      pulumi-bin
      awscli
      ripgrep
      google-cloud-sdk
  ]
