# -*- coding: utf-8 -*-
"""
Script de Auto-Registro de Equipos en Inventario SKN
=====================================================
- Recopila información completa del hardware
- Primera ejecución: Muestra ventana para seleccionar empresa
- Guarda configuración localmente
- Verifica si el equipo ya existe en la BD (por UUID)
- Si NO existe: Lo registra automáticamente
- Si existe: Actualiza los datos
- Ejecuciones siguientes: Corre automático sin interfaz
"""

import platform
import psutil
import socket
import uuid
import json
import os
import sys
from datetime import datetime
import tkinter as tk
from tkinter import ttk, messagebox
import subprocess

try:
    import wmi
    WMI_AVAILABLE = True
except:
    WMI_AVAILABLE = False

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
except ImportError:
    print("❌ ERROR: Necesitas instalar psycopg2")
    print("Ejecuta: pip install psycopg2-binary")
    sys.exit(1)


# =========================
# CONFIGURACIÓN
# =========================
CONFIG_FILE = "skn_equipo_config.json"

DB_CONFIG = {
    "host": "autorack.proxy.rlwy.net",
    "port": 16991,
    "database": "railway",
    "user": "postgres",
    "password": "IQrhQJONUFJQoMbkFpajUWHJYGODvdwP"
}


# =========================
# FUNCIONES DE HARDWARE
# =========================
def obtener_uuid_maquina():
    """Obtiene identificador único de la máquina"""
    try:
        if platform.system() == "Windows":
            # Usar WMIC para obtener UUID del BIOS
            result = subprocess.run(
                ["wmic", "csproduct", "get", "UUID"],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0:
                lines = result.stdout.strip().split('\n')
                if len(lines) > 1:
                    return lines[1].strip()
        
        # Fallback: usar MAC address
        return str(uuid.UUID(int=uuid.getnode()))
    except:
        return str(uuid.UUID(int=uuid.getnode()))


def obtener_mac_address():
    """Obtiene la dirección MAC principal"""
    try:
        mac_num = uuid.getnode()
        mac = ':'.join(('%012X' % mac_num)[i:i+2] for i in range(0, 12, 2))
        return mac
    except:
        return "No disponible"


def obtener_info_hardware():
    """Recopila información detallada del hardware"""
    info = {
        "uuid": obtener_uuid_maquina(),
        "hostname": socket.gethostname(),
        "mac_address": obtener_mac_address(),
        "ip_local": "No disponible",
        "sistema_operativo": f"{platform.system()} {platform.release()}",
        "version_so": platform.version(),
        "arquitectura": platform.machine(),
        "procesador": platform.processor(),
        "nucleos_fisicos": psutil.cpu_count(logical=False),
        "nucleos_logicos": psutil.cpu_count(logical=True),
        "frecuencia_cpu_mhz": 0,
        "ram_total_gb": round(psutil.virtual_memory().total / 1024**3, 2),
        "ram_velocidad_mhz": 0,
        "modulos_ram": "",
        "almacenamiento": "",
        "tipo_almacenamiento": "",
        "interface_almacenamiento": "",
        "tarjeta_grafica": "",
        "gpu_ram_mb": 0,
        "driver_gpu": "",
        "resolucion_pantalla": "",
        "bios": "",
        "placa_base": "",
        "adaptadores_red": "",
        "bateria": "",
        "pantalla": ""
    }
    
    # IP Local
    try:
        info["ip_local"] = socket.gethostbyname(socket.gethostname())
    except:
        pass
    
    # Frecuencia CPU
    try:
        cpu_freq = psutil.cpu_freq()
        if cpu_freq:
            info["frecuencia_cpu_mhz"] = int(cpu_freq.max)
    except:
        pass
    
    # Información con WMI (Windows)
    if platform.system() == "Windows" and WMI_AVAILABLE:
        try:
            c = wmi.WMI()
            
            # BIOS
            for bios in c.Win32_BIOS():
                info["bios"] = f"{bios.Manufacturer} {bios.Version}"
                break
            
            # Placa Base
            for board in c.Win32_BaseBoard():
                info["placa_base"] = f"{board.Manufacturer} {board.Product}"
                break
            
            # Procesador detallado
            for cpu in c.Win32_Processor():
                info["procesador"] = cpu.Name
                if cpu.MaxClockSpeed:
                    info["frecuencia_cpu_mhz"] = cpu.MaxClockSpeed
                break
            
            # RAM
            modulos = []
            for mem in c.Win32_PhysicalMemory():
                capacidad_gb = round(int(mem.Capacity) / 1024**3, 2)
                velocidad = mem.Speed if mem.Speed else 0
                if velocidad > info["ram_velocidad_mhz"]:
                    info["ram_velocidad_mhz"] = velocidad
                modulos.append(f"{capacidad_gb}GB @ {velocidad}MHz")
            info["modulos_ram"] = " + ".join(modulos)
            
            # GPU
            for gpu in c.Win32_VideoController():
                info["tarjeta_grafica"] = gpu.Name
                if gpu.DriverVersion:
                    info["driver_gpu"] = gpu.DriverVersion
                if gpu.AdapterRAM:
                    info["gpu_ram_mb"] = round(int(gpu.AdapterRAM) / 1024**2, 2)
                if gpu.CurrentHorizontalResolution:
                    info["resolucion_pantalla"] = f"{gpu.CurrentHorizontalResolution}x{gpu.CurrentVerticalResolution}"
                break
            
            # Discos
            discos = []
            for disk in c.Win32_DiskDrive():
                tamano_gb = round(int(disk.Size) / 1024**3, 2) if disk.Size else 0
                discos.append(f"{disk.Model} ({tamano_gb}GB)")
                
                if "SSD" in disk.Model.upper() or "NVMe" in disk.Model.upper():
                    info["tipo_almacenamiento"] = "SSD/NVMe"
                elif "HDD" in disk.Model.upper():
                    info["tipo_almacenamiento"] = "HDD"
                
                if disk.InterfaceType:
                    info["interface_almacenamiento"] = disk.InterfaceType
                    
            info["almacenamiento"] = " + ".join(discos)
            
            # Adaptadores de red
            adapters = []
            for adapter in c.Win32_NetworkAdapter():
                if adapter.PhysicalAdapter and adapter.MACAddress:
                    adapters.append(f"{adapter.Name} ({adapter.MACAddress})")
            info["adaptadores_red"] = "; ".join(adapters[:3])  # Primeros 3
            
        except Exception as e:
            print(f"⚠️  Error al obtener info WMI: {e}")
    
    # Batería (para laptops)
    try:
        battery = psutil.sensors_battery()
        if battery:
            info["bateria"] = f"{battery.percent}% ({'Conectada' if battery.power_plugged else 'Desconectada'})"
            info["pantalla"] = "Laptop con pantalla integrada"
        else:
            info["bateria"] = "PC de escritorio sin batería"
    except:
        pass
    
    return info


# =========================
# CONFIGURACIÓN LOCAL
# =========================
def cargar_configuracion():
    """Carga configuración local si existe"""
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return None
    return None


def guardar_configuracion(empresa_id, empresa_nombre, sucursal_id=None):
    """Guarda configuración local"""
    config = {
        "empresa_id": empresa_id,
        "empresa_nombre": empresa_nombre,
        "sucursal_id": sucursal_id,
        "fecha_configuracion": datetime.now().isoformat()
    }
    with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=2, ensure_ascii=False)


# =========================
# INTERFAZ GRÁFICA
# =========================
class VentanaSeleccionEmpresa:
    def __init__(self):
        self.empresa_seleccionada = None
        self.sucursal_seleccionada = None
        self.empresas = []
        self.sucursales = []
        
        self.root = tk.Tk()
        self.root.title("🏢 Configuración Inicial - SKN Inventario")
        self.root.geometry("500x400")
        self.root.resizable(False, False)
        
        # Centrar ventana
        self.root.update_idletasks()
        x = (self.root.winfo_screenwidth() // 2) - (500 // 2)
        y = (self.root.winfo_screenheight() // 2) - (400 // 2)
        self.root.geometry(f"+{x}+{y}")
        
        self.crear_interfaz()
        
    def crear_interfaz(self):
        # Título
        frame_titulo = tk.Frame(self.root, bg="#2c3e50", height=80)
        frame_titulo.pack(fill="x")
        frame_titulo.pack_propagate(False)
        
        tk.Label(
            frame_titulo,
            text="🏢 Configuración Inicial",
            font=("Arial", 18, "bold"),
            fg="white",
            bg="#2c3e50"
        ).pack(pady=10)
        
        tk.Label(
            frame_titulo,
            text="Selecciona tu empresa para registrar este equipo",
            font=("Arial", 10),
            fg="#ecf0f1",
            bg="#2c3e50"
        ).pack()
        
        # Contenido
        frame_contenido = tk.Frame(self.root, padx=30, pady=20)
        frame_contenido.pack(fill="both", expand=True)
        
        # Empresa
        tk.Label(
            frame_contenido,
            text="Empresa:",
            font=("Arial", 11, "bold")
        ).pack(anchor="w", pady=(10, 5))
        
        self.combo_empresa = ttk.Combobox(
            frame_contenido,
            state="readonly",
            font=("Arial", 10),
            width=45
        )
        self.combo_empresa.pack(fill="x", pady=(0, 15))
        self.combo_empresa.bind("<<ComboboxSelected>>", self.on_empresa_seleccionada)
        
        # Sucursal
        tk.Label(
            frame_contenido,
            text="Sucursal (opcional):",
            font=("Arial", 11, "bold")
        ).pack(anchor="w", pady=(10, 5))
        
        self.combo_sucursal = ttk.Combobox(
            frame_contenido,
            state="disabled",
            font=("Arial", 10),
            width=45
        )
        self.combo_sucursal.pack(fill="x", pady=(0, 20))
        
        # Botones
        frame_botones = tk.Frame(frame_contenido)
        frame_botones.pack(fill="x", pady=(20, 0))
        
        tk.Button(
            frame_botones,
            text="✅ Confirmar",
            command=self.confirmar,
            bg="#27ae60",
            fg="white",
            font=("Arial", 11, "bold"),
            padx=20,
            pady=10,
            cursor="hand2"
        ).pack(side="left", expand=True, fill="x", padx=(0, 5))
        
        tk.Button(
            frame_botones,
            text="❌ Cancelar",
            command=self.cancelar,
            bg="#e74c3c",
            fg="white",
            font=("Arial", 11, "bold"),
            padx=20,
            pady=10,
            cursor="hand2"
        ).pack(side="right", expand=True, fill="x", padx=(5, 0))
        
        # Cargar datos
        self.cargar_empresas()
        
    def cargar_empresas(self):
        """Carga empresas desde la BD"""
        try:
            conn = psycopg2.connect(**DB_CONFIG)
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            cur.execute("SELECT id, nombre FROM empresas WHERE activo = true ORDER BY nombre")
            self.empresas = cur.fetchall()
            
            valores = [f"{emp['id']} - {emp['nombre']}" for emp in self.empresas]
            self.combo_empresa['values'] = valores
            
            if valores:
                self.combo_empresa.current(0)
                self.on_empresa_seleccionada(None)
            
            cur.close()
            conn.close()
        except Exception as e:
            messagebox.showerror("Error", f"No se pudo conectar a la base de datos:\n{e}")
            self.root.destroy()
    
    def on_empresa_seleccionada(self, event):
        """Cuando se selecciona una empresa, cargar sus sucursales"""
        seleccion = self.combo_empresa.get()
        if not seleccion:
            return
        
        empresa_id = int(seleccion.split(' - ')[0])
        
        try:
            conn = psycopg2.connect(**DB_CONFIG)
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            cur.execute(
                "SELECT id, nombre FROM sucursales WHERE empresa_id = %s AND activo = true ORDER BY es_principal DESC, nombre",
                (empresa_id,)
            )
            self.sucursales = cur.fetchall()
            
            if self.sucursales:
                valores = [f"{suc['id']} - {suc['nombre']}" for suc in self.sucursales]
                self.combo_sucursal['values'] = valores
                self.combo_sucursal['state'] = "readonly"
                self.combo_sucursal.current(0)
            else:
                self.combo_sucursal['values'] = []
                self.combo_sucursal['state'] = "disabled"
                self.combo_sucursal.set("")
            
            cur.close()
            conn.close()
        except Exception as e:
            print(f"Error al cargar sucursales: {e}")
    
    def confirmar(self):
        if not self.combo_empresa.get():
            messagebox.showwarning("Advertencia", "Debes seleccionar una empresa")
            return
        
        empresa_id = int(self.combo_empresa.get().split(' - ')[0])
        
        sucursal_id = None
        if self.combo_sucursal.get():
            sucursal_id = int(self.combo_sucursal.get().split(' - ')[0])
        
        self.empresa_seleccionada = empresa_id
        self.sucursal_seleccionada = sucursal_id
        self.root.destroy()
    
    def cancelar(self):
        self.root.destroy()
    
    def mostrar(self):
        self.root.mainloop()
        return self.empresa_seleccionada, self.sucursal_seleccionada


# =========================
# BASE DE DATOS
# =========================
def obtener_categoria_notebook():
    """Obtiene el ID de la categoría Notebooks"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute("SELECT id FROM categorias_materiales WHERE nombre ILIKE '%notebook%' OR nombre ILIKE '%pc%' LIMIT 1")
        result = cur.fetchone()
        
        cur.close()
        conn.close()
        
        return result['id'] if result else None
    except Exception as e:
        print(f"Error al obtener categoría: {e}")
        return None


def verificar_equipo_existe(uuid_equipo):
    """Verifica si el equipo ya está registrado por UUID"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Buscar en valores_atributos_material si existe un equipo con este UUID
        cur.execute("""
            SELECT m.id, m.nombre, m.codigo, e.nombre as empresa_nombre
            FROM materiales m
            JOIN valores_atributos_material vam ON m.id = vam.material_id
            JOIN atributos_categoria ac ON vam.atributo_id = ac.id
            JOIN empresas e ON m.empresa_id = e.id
            WHERE ac.nombre = 'Serial/UUID' AND vam.valor = %s
            LIMIT 1
        """, (uuid_equipo,))
        
        result = cur.fetchone()
        
        cur.close()
        conn.close()
        
        return result
    except Exception as e:
        print(f"Error al verificar equipo: {e}")
        return None


def registrar_equipo(info_hardware, empresa_id, sucursal_id=None):
    """Registra un nuevo equipo en el inventario"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        categoria_id = obtener_categoria_notebook()
        if not categoria_id:
            print("❌ No se encontró categoría Notebooks/PCs")
            return False
        
        # Determinar nombre y código
        nombre = f"{info_hardware['hostname']} - {info_hardware['procesador'][:50]}"
        codigo = f"PC-{info_hardware['uuid'][:8]}"
        
        # Insertar material
        cur.execute("""
            INSERT INTO materiales (
                empresa_id, categoria_id, nombre, marca, modelo, descripcion,
                codigo, stock_actual, stock_minimo, sucursal_id
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            empresa_id,
            categoria_id,
            nombre,
            platform.system(),  # marca: Windows, Linux, etc.
            info_hardware['sistema_operativo'],  # modelo: Windows 11, etc.
            f"Equipo registrado automáticamente el {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            codigo,
            1,  # stock_actual
            1,  # stock_minimo
            sucursal_id
        ))
        
        material_id = cur.fetchone()['id']
        
        # Obtener todos los atributos de la categoría
        cur.execute("""
            SELECT id, nombre FROM atributos_categoria 
            WHERE categoria_id = %s
        """, (categoria_id,))
        
        atributos = {attr['nombre']: attr['id'] for attr in cur.fetchall()}
        
        # Mapeo de datos a atributos
        mapeo = {
            'Serial/UUID': info_hardware['uuid'],
            'Hostname': info_hardware['hostname'],
            'MAC Address': info_hardware['mac_address'],
            'IP Local': info_hardware['ip_local'],
            'Procesador': info_hardware['procesador'],
            'Núcleos CPU': str(info_hardware['nucleos_fisicos']),
            'Threads CPU': str(info_hardware['nucleos_logicos']),
            'Frecuencia CPU MHz': str(info_hardware['frecuencia_cpu_mhz']),
            'RAM': f"{info_hardware['ram_total_gb']} GB",
            'RAM Velocidad MHz': str(info_hardware['ram_velocidad_mhz']) if info_hardware['ram_velocidad_mhz'] else '',
            'Módulos RAM': info_hardware['modulos_ram'],
            'Almacenamiento': info_hardware['almacenamiento'],
            'Tipo Almacenamiento': info_hardware['tipo_almacenamiento'],
            'Interface Almacenamiento': info_hardware['interface_almacenamiento'],
            'Tarjeta Gráfica': info_hardware['tarjeta_grafica'],
            'GPU RAM MB': str(info_hardware['gpu_ram_mb']) if info_hardware['gpu_ram_mb'] else '',
            'Driver GPU': info_hardware['driver_gpu'],
            'Sistema Operativo': info_hardware['sistema_operativo'],
            'BIOS': info_hardware['bios'],
            'Placa Base': info_hardware['placa_base'],
            'Pantalla': info_hardware['pantalla'],
            'Resolución Pantalla': info_hardware['resolucion_pantalla'],
            'Batería': info_hardware['bateria'],
            'Adaptadores Red': info_hardware['adaptadores_red'],
            'Fecha Registro': datetime.now().strftime('%Y-%m-%d'),
            'Última Actualización': datetime.now().strftime('%Y-%m-%d')
        }
        
        # Insertar atributos
        for nombre_attr, valor in mapeo.items():
            if nombre_attr in atributos and valor:
                cur.execute("""
                    INSERT INTO valores_atributos_material (material_id, atributo_id, valor)
                    VALUES (%s, %s, %s)
                """, (material_id, atributos[nombre_attr], valor))
        
        conn.commit()
        cur.close()
        conn.close()
        
        print(f"\n✅ Equipo registrado exitosamente!")
        print(f"   ID: {material_id}")
        print(f"   Nombre: {nombre}")
        print(f"   Código: {codigo}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error al registrar equipo: {e}")
        import traceback
        traceback.print_exc()
        return False


def actualizar_equipo(material_id, info_hardware):
    """Actualiza la información de un equipo existente"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Obtener categoria_id del material
        cur.execute("SELECT categoria_id FROM materiales WHERE id = %s", (material_id,))
        result = cur.fetchone()
        if not result:
            return False
        
        categoria_id = result['categoria_id']
        
        # Obtener atributos
        cur.execute("""
            SELECT id, nombre FROM atributos_categoria 
            WHERE categoria_id = %s
        """, (categoria_id,))
        
        atributos = {attr['nombre']: attr['id'] for attr in cur.fetchall()}
        
        # Mapeo actualizado
        mapeo = {
            'IP Local': info_hardware['ip_local'],
            'RAM': f"{info_hardware['ram_total_gb']} GB",
            'Sistema Operativo': info_hardware['sistema_operativo'],
            'Driver GPU': info_hardware['driver_gpu'],
            'Batería': info_hardware['bateria'],
            'Última Actualización': datetime.now().strftime('%Y-%m-%d')
        }
        
        # Actualizar valores
        for nombre_attr, valor in mapeo.items():
            if nombre_attr in atributos and valor:
                cur.execute("""
                    INSERT INTO valores_atributos_material (material_id, atributo_id, valor)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (material_id, atributo_id) 
                    DO UPDATE SET valor = EXCLUDED.valor
                """, (material_id, atributos[nombre_attr], valor))
        
        conn.commit()
        cur.close()
        conn.close()
        
        print(f"\n✅ Equipo actualizado exitosamente (ID: {material_id})")
        return True
        
    except Exception as e:
        print(f"❌ Error al actualizar equipo: {e}")
        return False


# =========================
# MAIN
# =========================
def main():
    print("=" * 60)
    print("🖥️  SISTEMA DE AUTO-REGISTRO DE EQUIPOS - SKN INVENTARIO")
    print("=" * 60)
    print()
    
    # 1. Recopilar información del hardware
    print("📊 Recopilando información del equipo...")
    info_hardware = obtener_info_hardware()
    
    print(f"\n✓ UUID: {info_hardware['uuid']}")
    print(f"✓ Hostname: {info_hardware['hostname']}")
    print(f"✓ IP: {info_hardware['ip_local']}")
    print(f"✓ Procesador: {info_hardware['procesador']}")
    print(f"✓ RAM: {info_hardware['ram_total_gb']} GB")
    print(f"✓ SO: {info_hardware['sistema_operativo']}")
    
    # 2. Verificar si ya existe en la BD
    print(f"\n🔍 Verificando si el equipo ya está registrado...")
    equipo_existente = verificar_equipo_existe(info_hardware['uuid'])
    
    if equipo_existente:
        print(f"\n✅ Equipo YA registrado:")
        print(f"   Nombre: {equipo_existente['nombre']}")
        print(f"   Código: {equipo_existente['codigo']}")
        print(f"   Empresa: {equipo_existente['empresa_nombre']}")
        print(f"\n🔄 Actualizando datos...")
        
        actualizar_equipo(equipo_existente['id'], info_hardware)
        print("\n✅ Proceso completado. El equipo se actualizó automáticamente.")
        return
    
    # 3. No existe: Verificar configuración local
    print(f"\n⚠️  Equipo NO registrado en la base de datos")
    config = cargar_configuracion()
    
    empresa_id = None
    sucursal_id = None
    
    if config:
        print(f"\n✓ Configuración local encontrada:")
        print(f"  Empresa: {config['empresa_nombre']}")
        empresa_id = config['empresa_id']
        sucursal_id = config.get('sucursal_id')
    else:
        print(f"\n🏢 PRIMERA EJECUCIÓN - Necesitamos configurar el equipo")
        print(f"   Se abrirá una ventana para seleccionar tu empresa...\n")
        
        input("Presiona ENTER para continuar...")
        
        # Mostrar ventana de selección
        ventana = VentanaSeleccionEmpresa()
        empresa_id, sucursal_id = ventana.mostrar()
        
        if not empresa_id:
            print("\n❌ Configuración cancelada. No se registró el equipo.")
            return
        
        # Obtener nombre de empresa para guardar
        try:
            conn = psycopg2.connect(**DB_CONFIG)
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("SELECT nombre FROM empresas WHERE id = %s", (empresa_id,))
            empresa_nombre = cur.fetchone()['nombre']
            cur.close()
            conn.close()
            
            guardar_configuracion(empresa_id, empresa_nombre, sucursal_id)
            print(f"\n✓ Configuración guardada localmente")
        except:
            pass
    
    # 4. Registrar el equipo
    print(f"\n📝 Registrando equipo en el inventario...")
    if registrar_equipo(info_hardware, empresa_id, sucursal_id):
        print(f"\n✅ ¡ÉXITO! El equipo se registró correctamente")
        print(f"   Próximas ejecuciones serán automáticas sin interfaz gráfica")
    else:
        print(f"\n❌ Error al registrar el equipo")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n❌ Proceso cancelado por el usuario")
    except Exception as e:
        print(f"\n❌ Error inesperado: {e}")
        import traceback
        traceback.print_exc()
    
    input("\nPresiona ENTER para salir...")
