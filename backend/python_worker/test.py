import shapefile
import rarfile
import os
import tempfile
import glob
import json

archive_path = "test_shape.rar"
def test():
    with tempfile.TemporaryDirectory() as extract_dir:
        try:
            with rarfile.RarFile(archive_path) as rf:
                rf.extractall(extract_dir)
            
            shp_files = glob.glob(os.path.join(extract_dir, '**', '*.shp'), recursive=True)
            print(f"Archivos SHP encontrados: {shp_files}")
            
            if not shp_files:
                print("No se encontraron .shp")
                return
                
            all_features = []
            for shp_path in shp_files:
                layer_name = os.path.splitext(os.path.basename(shp_path))[0]
                print(f"Procesando: {layer_name}")
                try:
                    with shapefile.Reader(shp_path) as reader:
                        fields = [f[0] for f in reader.fields[1:]]
                        for sr in reader.shapeRecords():
                            geom = sr.shape.__geo_interface__
                            props = dict(zip(fields, sr.record))
                            props['_layer_name'] = layer_name
                            for k, v in props.items():
                                if isinstance(v, (bytes, bytearray)):
                                    props[k] = str(v)
                            feature = {"type": "Feature", "geometry": geom, "properties": props}
                            all_features.append(feature)
                        print(f"Éxito con {layer_name}. Features: {len(reader.shapeRecords())}")
                except Exception as e:
                    print(f"Error procesando {layer_name}: {e}")
            
            print(f"Total features: {len(all_features)}")
        except Exception as e:
            print(f"Error general: {e}")

if __name__ == "__main__":
    test()
