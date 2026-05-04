import random
import time

def check_ganas_de_irme():
    hambre_nivel = 9000
    aburrimiento = 10000000000000000000000000000000000000
    ganas_de_viciar = True
    
    mensajes_random = [
        "Vamonos ya, q las rankets no se juegan solas",
        "Mi poto dice que es hora de irse. Confirmamos: CONFIRMAMOS. ",
        "Vamonos mrd mi gripe porcina ya está tocando un solo de bateria",
        "Fuga nivel: Extrema.",
        "Si nos quedamos 5 minutos más, me convierto en un NPC."
    ]

    print("--- A q hora nos vamos perra ---")
    time.sleep(1) 

    if ganas_de_viciar or hambre_nivel > 500:
        print(f"go vicio?: {random.choice(mensajes_random)}")
        print(f"Estoy aburrio: {aburrimiento}%")
    else:
        print("Micaelaaaa donde estas")

if __name__ == "__main__":
    check_ganas_de_irme()