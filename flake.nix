{
  description = "Data Engineering Learning Path — dev environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
      in {
        devShells.default = pkgs.mkShell {
          packages = [
            pkgs.bun
            pkgs.supabase-cli
            pkgs.nodejs_22
            pkgs.git
          ];

          shellHook = ''
            echo "Data Engineering Learning Path dev shell"
            echo "  bun       $(bun --version)"
            echo "  node      $(node --version)"
            echo "  supabase  $(supabase --version 2>/dev/null || echo 'n/a')"
          '';
        };
      });
}
