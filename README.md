# nova-ia-proxy

Un **mini-serveur relais** entre [Nova.ia](https://github.com/Alex12062012/Nova.ia) et l'API d'OpenAI.

L'API d'OpenAI ne peut pas être appelée directement depuis une page web : il y a le blocage CORS, et la clé serait visible de tous. Nova.ia envoie donc ses messages à ce serveur, qui ajoute la clé OpenAI de son côté et renvoie la réponse **en streaming**.

## Routes

| Route | Rôle |
|---|---|
| `GET /` | test de santé : `{"status":"ok","service":"nova-ia-proxy"}` |
| `POST /openai` | transmet le corps de la requête à `https://api.openai.com/v1/chat/completions` et renvoie la réponse telle quelle |

## Lancer

```bash
npm install
OPENAI_API_KEY=sk-... npm start      # port 3000 par défaut
```

Sur Render, `render.yaml` crée le service. Il faut ensuite ajouter la variable `OPENAI_API_KEY` dans le tableau de bord (elle n'est jamais écrite dans le code).

## ⚠️ Précautions

Le proxy accepte les requêtes de **n'importe quel site** (`Access-Control-Allow-Origin: *`), et il n'y a ni mot de passe ni limite. Quelqu'un qui connaît son adresse peut donc s'en servir pour discuter avec GPT **aux frais de la clé OpenAI enregistrée**.

Pour limiter le risque, quelques idées :
- n'autoriser que l'adresse de Nova.ia dans `Access-Control-Allow-Origin` ;
- ajouter un mot de passe partagé, envoyé dans un en-tête ;
- n'accepter qu'une petite liste de modèles et limiter `max_tokens` ;
- fixer un **plafond de dépense** dans le tableau de bord OpenAI.
