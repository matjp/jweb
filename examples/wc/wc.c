#define OK 1
#define usage_error 1
#define cannot_open_file 2 \

#define READ_ONLY 0 \

#define buf_size BUFSIZ \

#define print_count(n) printf("%8ld",n)  \

/*1:*/
#line 2 "./examples/wc/wc.w"

/*2:*/
#line 9 "./examples/wc/wc.w"

#include<stdio.h> 

/*:2*/
#line 3 "./examples/wc/wc.w"

/*4:*/
#line 18 "./examples/wc/wc.w"

int status= OK;
char*prog_name;

/*:4*//*16:*/
#line 108 "./examples/wc/wc.w"

long tot_word_count,tot_line_count,tot_char_count;


/*:16*/
#line 4 "./examples/wc/wc.w"

/*23:*/
#line 161 "./examples/wc/wc.w"

wc_print(which,char_count,word_count,line_count)
char*which;
long char_count,word_count,line_count;
{
while(*which)
switch(*which++){
case'l':print_count(line_count);break;
case'w':print_count(word_count);break;
case'c':print_count(char_count);break;
default:if((status&usage_error)==0){
fprintf(stderr,"\nUsage: %s [-lwc] [filename ...]\n",prog_name);

status|= usage_error;
}
}
}

/*:23*/
#line 5 "./examples/wc/wc.w"

/*5:*/
#line 23 "./examples/wc/wc.w"

main(argc,argv)
int argc;
char**argv;
{
/*6:*/
#line 37 "./examples/wc/wc.w"

int file_count;
char*which;
int silent= 0;

/*:6*//*9:*/
#line 66 "./examples/wc/wc.w"

int fd= 0;

/*:9*//*14:*/
#line 92 "./examples/wc/wc.w"

char buffer[buf_size];
register char*ptr;
register char*buf_end;
register int c;
int in_word;
long word_count,line_count,char_count;


/*:14*/
#line 28 "./examples/wc/wc.w"
;
prog_name= argv[0];
/*7:*/
#line 43 "./examples/wc/wc.w"

which= "lwc";
if(argc> 1&&*argv[1]=='-'){
argv[1]++;
if(*argv[1]=='s')silent= 1,argv[1]++;
if(*argv[1])which= argv[1];
argc--;argv++;
}
file_count= argc-1;

/*:7*/
#line 30 "./examples/wc/wc.w"
;
/*8:*/
#line 54 "./examples/wc/wc.w"

argc--;
do{
/*11:*/
#line 74 "./examples/wc/wc.w"

if(file_count> 0&&(fd= open(*(++argv),READ_ONLY))<0){
fprintf(stderr,"%s: cannot open file %s\n",prog_name,*argv);

status|= cannot_open_file;
file_count--;
continue;
}

/*:11*/
#line 57 "./examples/wc/wc.w"
;
/*15:*/
#line 102 "./examples/wc/wc.w"

ptr= buf_end= buffer;
line_count= word_count= char_count= 0;
in_word= 0;

/*:15*/
#line 58 "./examples/wc/wc.w"
;
/*17:*/
#line 113 "./examples/wc/wc.w"

while(1){
/*18:*/
#line 127 "./examples/wc/wc.w"

if(ptr>=buf_end){
ptr= buffer;c= read(fd,ptr,buf_size);
if(c<=0)break;
char_count+= c;buf_end= buffer+c;
}

/*:18*/
#line 115 "./examples/wc/wc.w"
;
c= *ptr++;
if(c> ' '&&c<0177){
if(!in_word){word_count++;in_word= 1;}
continue;
}
if(c=='\n')line_count++;
else if(c!=' '&&c!='\t')continue;
in_word= 0;
}

/*:17*/
#line 59 "./examples/wc/wc.w"
;
/*19:*/
#line 135 "./examples/wc/wc.w"

if(!silent){
wc_print(which,char_count,word_count,line_count);
if(file_count)printf(" %s\n",*argv);
else printf("\n");
}

/*:19*/
#line 60 "./examples/wc/wc.w"
;
/*12:*/
#line 84 "./examples/wc/wc.w"

close(fd);

/*:12*/
#line 61 "./examples/wc/wc.w"
;
/*20:*/
#line 143 "./examples/wc/wc.w"

tot_line_count+= line_count;
tot_word_count+= word_count;
tot_char_count+= char_count;

/*:20*/
#line 62 "./examples/wc/wc.w"
;
}while(--argc> 0);

/*:8*/
#line 31 "./examples/wc/wc.w"
;
/*21:*/
#line 149 "./examples/wc/wc.w"

if(file_count> 1||silent){
wc_print(which,tot_char_count,tot_word_count,tot_line_count);
if(!file_count)printf("\n");
else printf(" total in %d file%s\n",file_count,file_count> 1?"s":"");
}

/*:21*/
#line 32 "./examples/wc/wc.w"
;
exit(status);
}

/*:5*/
#line 6 "./examples/wc/wc.w"


/*:1*/
