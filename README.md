# tile_editor
Work in progress. A dev tool for laying out tile-based patterns, maps, etc. 
Originally created to aid the development of my Keeper of the Labyrinth project, since that project includes a save file viewer in the form of a branching map.
Intended to become a stand-alone application with an Electron build, capable of importing and exporting .JSON files to represent the tile structure created, as well as user-defined tilesets to work with in the GUI.
Most importantly, sets up a Grid data structure to store tiles in a two-dimensional, coordinate-indexed map capable of being expanded and shrunk on the fly, without compromising the coordinate references to tile positions.
