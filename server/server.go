package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"slices"
	"strings"
	"sync"
	"unicode/utf8"

	"github.com/fatih/color"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/compress"
	"github.com/jmoiron/sqlx"
	_ "github.com/mattn/go-sqlite3"
	"github.com/skratchdot/open-golang/open"
	//_ "modernc.org/sqlite"
)

type QueryPayload struct {
	DBName string `json:"dbname"`
	Query  string `json:"query"`
}

var (
	dbConnections = make(map[string]*sqlx.DB)
	mutex         sync.Mutex
	APPNAME       = "Tipitaka BJT v1.0"
	userBJTPath   = "" // call such as ./server -bjt-path=/Volumes/1TB/Webstorm/pitaka/bjt/newbooks
	rootPath      = "" // call such as ./server -root-path=../../ relative to the exePath
	exePath       = "" // determined programmetically below
	PORT          = ":8401"
	URL           = "http://localhost" + PORT
)

func getPathToFile(file string) string {
	return filepath.Join(exePath, rootPath, file)
}

func queryDb(payload QueryPayload) (*[]map[string]interface{}, error) {
	// Get or create database connection
	mutex.Lock()
	db, exists := dbConnections[payload.DBName]
	if !exists {
		var err error
		db, err = sqlx.Open("sqlite3", getPathToFile("server-data/"+payload.DBName)+"?mode=ro") // make sure to open read-only
		if err != nil {
			mutex.Unlock()
			return nil, err
		}
		dbConnections[payload.DBName] = db
	}
	mutex.Unlock()

	// Execute the SQL query
	rows, err := db.Queryx(payload.Query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	// Scan results into a slice of maps
	var results []map[string]interface{}
	for rows.Next() {
		result := make(map[string]interface{})
		err = rows.MapScan(result)
		if err != nil {
			return nil, err
		}
		results = append(results, result)
	}
	return &results, nil
}

func main() {
	printBox()

	noOpen := flag.Bool("no-open", false, "Prevent opening the URL in the browser")
	flag.StringVar(&userBJTPath, "bjt-path", "", "Local folder where BJT scanned pages are located.")
	flag.StringVar(&rootPath, "root-path", "", "Where dist and dbs are located relative to the binary location.")
	flag.Parse() // Parse the command-line flags
	exeFile, _ := os.Executable()
	exePath = filepath.Dir(exeFile)
	color.White("Flags no-open=%t, bjt-path=%s, root-path=%s, exePath: %s", *noOpen, userBJTPath, rootPath, exePath)

	app := fiber.New(fiber.Config{AppName: APPNAME, DisableStartupMessage: true})

	// Use gzip compression middleware
	app.Use(compress.New(compress.Config{
		Level: compress.LevelBestSpeed, // Adjust compression level as needed
	}))

	// Define the endpoint for sqlite queries
	app.Post("/sql-query", func(c *fiber.Ctx) error {
		//return executeQueryAndReturnJSON(c)
		var payload QueryPayload
		if err := c.BodyParser(&payload); err != nil {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}

		results, err := queryDb(payload)
		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}

		// Return the results as JSON
		return c.JSON(results)
	})

	// Load metadata
	metadata, allKeys, err := loadMiddlewareData()
	if err != nil {
		log.Fatal(err)
	}
	app.Use(metadataMiddleware(metadata, allKeys)) // Apply middleware to handle metadata (title/desc) injection

	app.Get("/tipitaka-query/version", func(c *fiber.Ctx) error {
		return c.SendString(APPNAME)
	})

	// Serve static files from dist folder
	app.Static("/", getPathToFile("dist"))
	// Define the "not found" handler to serve index.html - handles routes such as http://localhost:8400/dict/janaka
	app.Static("*", getPathToFile("dist/index.html")) // not found handler

	if !*noOpen {
		//color.Green("If your browser does not open automatically visit the following URL in your browser.")
		//color.Yellow("URL: %s", URL)
		if err := open.Start(URL); err != nil {
			color.Red("Failed to open URL(%s) %s", URL, err)
		}
	} else {
		color.White("URL (%s) not opened due to -no-open flag.", URL)
	}

	// Run the server
	log.Fatal(app.Listen(PORT))
}

func printBox() {
	gray := color.New(color.FgHiBlack)
	lines := []struct {
		Text  string
		Color *color.Color // Store the Color object directly
	}{
		{APPNAME, color.New(color.FgCyan, color.Bold)},
		{"┈┈┈┈┈┈┈┈┈┈┈┈", gray},
		{URL, color.New(color.FgYellow)},
		{"Visit the above URL in your browser to see the App.", color.New(color.FgHiGreen)},
		{"┄┄┄┄┄┄┄┄┄┈┈┈", gray},
		{"Suggestions and Errors - path.nirvana@gmail.com", gray},
		{"┄┄┄┄┄┄┄┄┄┈┈┈", gray},
		{"You can check if there is a newer version at", gray},
		{"https://github.com/pathnirvana/tipitaka.lk/releases", gray},
	}
	width := 60
	boxColor := gray

	// Print top border
	boxColor.Println("┏" + strings.Repeat("━", width) + "┓")

	for i := 0; i < len(lines); i++ {
		textLen := utf8.RuneCountInString(lines[i].Text)
		padding := (width - textLen) / 2 // Calculate padding for centering
		boxColor.Print("┃")
		fmt.Print(strings.Repeat(" ", padding))
		lines[i].Color.Print(lines[i].Text)
		fmt.Print(strings.Repeat(" ", width-padding-textLen))
		boxColor.Println("┃")
	}

	// Print bottom border
	boxColor.Println("┗" + strings.Repeat("━", width) + "┛")
}

type PageMetadata struct {
	Title       string `json:"title"`
	Description string `json:"description"`
}

func loadMiddlewareData() (*map[string]PageMetadata, *[]string, error) {
	data, err := os.ReadFile(getPathToFile("server-data/metadata.json"))
	if err != nil {
		return nil, nil, err
	}
	var metadata map[string]PageMetadata
	if err = json.Unmarshal(data, &metadata); err != nil {
		return nil, nil, err
	}

	results, err := queryDb(QueryPayload{DBName: "text.db", Query: "SELECT key FROM tree;"})
	if err != nil {
		return nil, nil, err
	}
	var allKeys []string
	for _, result := range *results {
		if str, ok := result["key"].(string); ok {
			allKeys = append(allKeys, str)
		}
	}
	return &metadata, &allKeys, nil
}

var scripts = []string{
	"sinh", "deva", "latn", "thai", "mymr", "khmr", "laoo", "beng", "tibt", "cyrl", "guru", "gujr", "telu", "knda", "mlym", "taml",
	"asse", "lana", "brah", "cakm", "java", "bali",
}

func metadataMiddleware(metadata *map[string]PageMetadata, allKeys *[]string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		parts := strings.Split(c.Path(), "/")
		if len(parts) < 3 {
			return c.Next()
		}
		if !slices.Contains(scripts, parts[1]) { // should be like /sinh/....
			return c.Next()
		}
		pageMetadata, exists := (*metadata)["/"+parts[2]]
		if !exists {
			if !slices.Contains(*allKeys, parts[2]) { // check the exisistance of a key and if not return
				return c.Next()
			}
			pageMetadata = (*metadata)["/key-placeholder"]
		}

		paramCount := strings.Count(pageMetadata.Title, "%s")
		if paramCount > 0 {
			var param string
			if len(parts) > 3 && (parts[2] == "book" || parts[2] == "search") {
				param = parts[3]
			} else {
				param = getSuttaNames(parts[2], parts[1])
			}

			// Replace the %s placeholders with the corresponding URL parameters
			pageMetadata.Title = fmt.Sprintf(pageMetadata.Title, param)
			pageMetadata.Description = fmt.Sprintf(pageMetadata.Description, param)
		}

		// Replace placeholders in your index.html template
		html, err := os.ReadFile(getPathToFile("dist/index.html"))
		if err != nil {
			return err
		}

		htmlStr := string(html)
		htmlStr = strings.ReplaceAll(htmlStr, "{{title}}", pageMetadata.Title)
		htmlStr = strings.ReplaceAll(htmlStr, "{{description}}", pageMetadata.Description)

		c.Set(fiber.HeaderContentType, fiber.MIMETextHTMLCharsetUTF8)
		return c.SendString(htmlStr)
	}
}

func getSuttaNames(key string, script string) string {
	parts := strings.Split(key, "-")
	var parentKeys []string
	// Generate parent keys by removing one part at a time from the end
	for i := len(parts); i > 0; i-- {
		parentKey := strings.Join(parts[:i], "-")
		parentKeys = append(parentKeys, "'"+parentKey+"'")
	}
	inClause := strings.Join(parentKeys, ", ")
	query := fmt.Sprintf("SELECT %s FROM tree WHERE key IN (%s) ORDER BY length(key) DESC;", script, inClause)

	results, err := queryDb(QueryPayload{DBName: "script-tree.db", Query: query})
	if err != nil {
		return key
	}
	var suttaNames []string
	for _, result := range *results {
		if str, ok := result[script].(string); ok {
			suttaNames = append(suttaNames, str)
		}
	}
	return strings.Join(suttaNames, " < ")
}
