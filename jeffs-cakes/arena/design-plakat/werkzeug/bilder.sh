#!/bin/bash
# Erzeugt die Graustufen-Vorlagen für den CSS-Raster-Druck (design-plakat/img/acts/*.webp)
set -e
S=${QUELLE:?"QUELLE=/pfad/zu/den/originalfotos setzen"}
O=${ZIEL:-"$(cd "$(dirname "$0")/.." && pwd)/img"}
mkdir -p "$O/acts"
SIZE=${SIZE:-640}
# id quelle cx(0-1) cy(0-1) zoom ziel-mittelwert kontrast kanal (R = Rotkanal trennt warmen Kuchen von dunklem Grund, L = Helligkeit)
while read id src cx cy zoom ziel k kanal; do
  [ -z "$id" ] && continue
  read w h <<< "$(identify -format "%w %h" "$S/$src")"
  side=$(python3 -c "print(int(min($w,$h)/$zoom))")
  x=$(python3 -c "print(max(0,min($w-$side,int($w*$cx-$side/2))))")
  y=$(python3 -c "print(max(0,min($h-$side,int($h*$cy-$side/2))))")
  if [ "$kanal" = R ]; then grau="-channel R -separate +channel"; else grau="-colorspace Gray"; fi
  convert "$S/$src" -background white -alpha remove -crop ${side}x${side}+$x+$y +repage -resize ${SIZE}x${SIZE} $grau -auto-level -unsharp 0x24+1.0+0 "$O/acts/_tmp.png"
  m=$(convert "$O/acts/_tmp.png" -format "%[fx:mean]" info:)
  g=$(python3 -c "import math;print(round(math.log($m)/math.log($ziel),3))")
  convert "$O/acts/_tmp.png" -gamma $g -sigmoidal-contrast ${k},50% -blur 0x0.6 -quality 62 -define webp:method=6 "$O/acts/$id.webp"
  echo "$id ${side}px@$x,$y mean=$m gamma=$g -> $(stat -c %s "$O/acts/$id.webp") B"
done <<'LIST'
jeffs-classic       solo-cheese.png      .5  .5  1    .62 3 L
chocolate-cha-cha   chocolate.png        .55 .5  1    .55 3 L
espresso-ensemble   Espresso.png         .47 .55 1    .5  3 R
pecan-prelude       Pecan.png            .44 .55 1    .48 3 R
brownies            brownies.png         .45 .55 1    .55 3 L
cupcakes            cupcakes.png         .4  .5  1    .6  3 L
bluesberry          Bluesberry.png       .5  .5  1    .46 3 R
latin-lemon         Lemon.png            .5  .55 1    .5  3 R
banana-bossa        banana.png           .5  .5  1    .58 3 L
crumble-rumble      crumble-rumble.jpg   .5  .5  1    .55 3 L
carrot-concerto     Carrot.png           .48 .55 1    .48 3 R
cinnamon-crossover  Cinnamon.png         .52 .55 1    .5  3 R
coconut-calypso     coconut.png          .45 .5  1    .58 3 L
peanut-butter-punk  Peanut.png           .5  .55 1    .46 3 R
oreo-oratorio       Oreo.png             .45 .55 1    .46 3 R
marble-mambo        Marble.png           .45 .55 1    .48 3 R
vegan               vegan.png            .5  .5  1    .58 3 L
pumpkin-polka       pumpkin-polka.jpg    .5  .5  1    .55 3 L
LIST
rm -f "$O/acts/_tmp.png"
