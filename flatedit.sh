#!/bin/bash
# CONTRIBUTION
## Author: Tom Sapletta
## Created Date: 11.05.2022
## Updated Date: 09.12.2023


# EXAMPLE
# ./flatedit.sh init
# flatedit

# TODO: github actions to merge the all files in the fly
# CONFIG
CMD=$1
#[ -z "$CMD" ] && CMD="install"
#
MODULE="flatedit"
FILE_EXT=".txt"
CONFIG_FILE=".${MODULE}"
CONFIG_DEFAULT="${MODULE}${FILE_EXT}"
CONFIG_CURRENT=$(less $CONFIG_FILE)
CONFIG_DEV="${MODULE}.dev${FILE_EXT}"
CONFIG_TEST="${MODULE}.test${FILE_EXT}"
LOGS=".${MODULE}.logs${FILE_EXT}"

#
if [ "$CMD" == "-h" ] || [ "$CMD" == "--help" ]; then
  echo "set config for:"
  echo "init - the default config, for customers"
  echo "install - INSTALL  flatedit.sh in SYSTEM: /usr/local/bin/ "
  echo "update - UPDATE  flatedit.sh in SYSTEM: /usr/local/bin/ "
  echo "dev - development packages, for contributors and developers"
  echo "test - for testing the project"
  echo ""
  exit
fi
## INIT FILE flatedit.txt
if [ "$CMD" == "init" ]; then
  echo -n "${CONFIG_DEFAULT}" > "${CONFIG_FILE}"
  echo "${LOGS}" >> ".gitignore"
  [ ! -f "${CONFIG_DEFAULT}" ] && echo -n "" > "${CONFIG_DEFAULT}"
  PROJECT_LIST=$(less ${CONFIG_DEFAULT})
  #echo "${PROJECT_LIST}"
  #[ ! -f "${PROJECT_LIST}" ] && echo -n "" > "${PROJECT_LIST}"
  exit
fi
## INSTALL in SYSTEM flatedit.sh
if [ "$CMD" == "install" ]; then
  sudo cp -f ${MODULE}.sh /usr/local/bin/${MODULE}
  exit
fi
## UPDATE in SYSTEM flatedit.sh
if [ "$CMD" == "update" ]; then
  #curl https://raw.githubusercontent.com/flatedit/bash/main/flatedit.sh -o flatedit
  curl https://raw.githubusercontent.com/flatedit/bash/main/flatedit.sh -o ${MODULE}.sh
  sudo cp -f ${MODULE}.sh /usr/local/bin/${MODULE}
  exit
fi
#
if [ "$CMD" == "dev" ]; then
  echo -n "$CONFIG_DEV" > "$CONFIG_FILE"
  exit
fi
if [ "$CMD" == "test" ]; then
  echo -n "$CONFIG_TEST" > "$CONFIG_FILE"
  exit
fi
#
PROJECT_LIST=$(less ${CONFIG_CURRENT})
echo $CONFIG_CURRENT
#echo $PROJECT_LIST
#exit
[ ! -f "${PROJECT_LIST}" ] && echo -n "" > "${PROJECT_LIST}"
#
DSL_HASH="#"
LOCAL_PATH=$(pwd)
for SUBFOLDER in ./*/*.md; do
  break
done
[ -z "$SUBFOLDER" ] && echo "NOT EXIST FOLDER WITH *.md FILES" && exit
#SUBFOLDER=${$SUBFOLDER%/*}
SUBFOLDER=$(dirname $SUBFOLDER)
MENU_URL="$SUBFOLDER/PROJECTS.md"
MENU_PATH="$SUBFOLDER/PROJECTS_LOCAL.md"
OUTPUT="README.md"

# START
echo "`date +"%T.%3N"` START" > $LOGS
echo "$(date +"%T.%3N") CREATE_MENU" >> $LOGS
#
DOMAIN="github.com"
[ -f "$CNAME" ] && DOMAIN=$(less $CNAME)
echo "+ [$DOMAIN](http://$DOMAIN)" > $MENU_URL
echo "+ [$LOCAL_PATH](file://$LOCAL_PATH/)" > $MENU_PATH
#

for FILE in $PROJECT_LIST; do
  line=$(head -n 1 $FILE)
  NAME=${FILE%%/*}
  URL=$DOMAIN/$NAME
  echo "+ [$NAME $line](http://$URL)" >> $MENU_URL
  echo "+ [$NAME $line](file://$LOCAL_PATH/$NAME/index.html)" >> $MENU_PATH
done

## combine from another sites
echo "$(date +"%T.%3N") COMBINE_FILES" >> $LOGS

# Get the URL of the 'origin' remote
remote_url=$(git config --get remote.origin.url)
IFS=/ read -r user_or_org repo_name <<< "$remote_url"
remote_url=${remote_url%.git}  # Remove '.git' from the end
#remote_url=${remote_url#*:}    # Remove everything before ':'
#remote_url=${remote_url#*/}    # Remove 'github.com/'
echo remote_url
echo "" > $OUTPUT
for FILE in $PROJECT_LIST; do
  # Remove Comments
  #echo ${FILE:0:1}
  #[ "${FILE:0:1}" == "${DSL_HASH}" ] && continue
  echo "$(date +"%T.%3N") COMBINE_FILE $FILE" >> $LOGS
  header_line_count=1
  #FOLDER=$(basename $FILE)
  # Read the header lines into the header variable
  HEADER=$(head -n $header_line_count "$FILE")
  # Read the rest of the file into the body variable, starting after the header
  BODY=$(tail -n +$((header_line_count + 1)) "$FILE")
  # Access the HEADER and BODY variables
  # get first line from file
  echo "${HEADER} [<span style='font-size:20px;'>&#x270D;</span>](${remote_url}/edit/main/${FILE})" >> $OUTPUT
  echo "$BODY" >> $OUTPUT
  #cat $FILE >> $OUTPUT
  echo "" >> $OUTPUT
done

echo "---" >> $OUTPUT
echo "+ Modular Documentation made possible by the [FlatEdit](http://www.flatedit.com) project." >> $OUTPUT

echo "`date +"%T.%3N"` STOP" >> $LOGS
cat $LOGS

