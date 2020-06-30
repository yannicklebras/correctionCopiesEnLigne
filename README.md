# correctionCopiesEnLigne
Outil de correction de copies en ligne avec barème

![](https://raw.githubusercontent.com/yannicklebras/correctionCopiesEnLigne/master/ccel.png)

Cet outil s'appuie sur PDSJsAnnotations de Ravisha Hesh (https://github.com/RavishaHesh/PDFJsAnnotations)
Il utilise PDF.js, jsPDF, Fabric.js principalement, pour l'ouverture de pdfs, l'enregistrement et l'annotation des pages.

Il ne fontionne que sur javascript, pas de base de données ni de php derrière. Le but est d'en faire un outil facilement utilisable sans avoir besoin d'un serveur trop développé. On peut cependant l'intégrer à une interface dédiée. Il peut même être utilisé en local sans serveur. Il n'est cependant pas hors-ligne car il utilise différentes librairies (qui peuvent éventuellement être chargées en local si on le souhaite).

**Attention :** les pdf sont transformés en images, il n'y a donc pas de détection du texte et de surlignage automatique. Le but est d'avoir un outil permettant d'annoter des copies scannées et de faire une correction avec un barème précis. 

Les fonctionnalités suivantes sont disponibles : 
- ouverture d'un PDF et d'un barème au format indiqué ci-après
- annotation des copies par dessin libre, ajout de texte, tampons (deux tampons pour le moment)
- zoom avant et arrière
- export de la copie en format PDF (barème détaillé sur la première page (en développement))
- enregistrement de la corection pou réouverture par la suite, avec annotations modifiables
- LaTeX via MathJax3 mais ce n'est pas une fonctionnalité que je vais approfondir.

Le format de barème retenu pour le moment est le suivant. Il s'agit d'un fichier json dont la structure est :
```JSON
{
    "nom": "nom du devoir",
    "date": "2020-03-14",
    "classe": "MPSI",
    "heure": "8h00",
    "duree": "4h",
    "nomEleve": "Eleve",
    "prenomEleve": "Numero1",
    "corrige": true,
    "appreciation": "appréciation générale du devoir",
    "bareme": [
        {
            "numero": "numéro de la question",
            "commentaire": "Commentaire relatif à la question",
            "items": [
                {
                    "description": "Calcul de la dérivée",
                    "points": "1",
                    "pas": "1",
                    "note": "0",
                    "type": "calcul"
                },
                {
                    "description": "Tableau de variation",
                    "points": "3",
                    "pas": "1",
                    "note": "O",
                    "type": "cours"
                },
                ...
            ]
        },
        {...}
        ]
}
```

Les points sont attribués sur chaque item entre 0 et ```points``` avec un pas de ```pas```. Par exemple pour un item noté sur 2 avec un pas de 0.5 on pourra attribuer 0, 0.5, 1, 1.5, 2. 



Reste à faire :
- améliorer la sortie PDF du barème
- outil d'aide à la création d'un barème
- meilleure gestion des tampons
- ajout dans le barème de commentaires classiques, qui reviennent souvent

