#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/time.h>
#include <OpenGL/gl.h>
#include <OpenGL/glu.h>
#include <GLUT/GLUT.h>
#include <math.h>

struct timeval start_time;
struct timeval now;
double t, lastFrameTime;
double frameRate;
double frameInterval;


GLfloat vLightPos[] = { -80.0f, 120.0f, 100.0f, 0.0f };

float dist = 110.0;

void drawCube() {
	GLfloat vertices[] = {
		1.0f,  1.0f, -1.0f,
		-1.0f,  1.0f, -1.0f,
		-1.0f, -1.0f, -1.0f,
		1.0f, -1.0f, -1.0f,
		1.0f, -1.0f,  1.0f,
		1.0f,  1.0f,  1.0f,
		-1.0f,  1.0f,  1.0f,
		-1.0f, -1.0f,  1.0f,
	};
	
	
	GLubyte indices[36] = {
		0,1,2,0,2,3,
		0,3,4,0,4,5, 
		0,5,6,0,6,1,
		7,6,1,7,1,2,
		7,4,5,7,5,6,
		7,2,3,7,3,4
	};
	
	glEnableClientState(GL_VERTEX_ARRAY);
	glVertexPointer(3, GL_FLOAT, 0, vertices);
	
	glNormal3f(0.0f, 0.0f, -1.0f);
	glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_BYTE, indices + 0);
	
	glNormal3f(1.0f, 0.0f, 0.0f);
	glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_BYTE, indices + 6);
	
	glNormal3f(0.0f, 1.0f, 0.0f);
	glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_BYTE, indices + 12);
	
	glNormal3f(-1.0f, 0.0f, 0.0f);
	glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_BYTE, indices + 18);
	
	glNormal3f(0.0f, 0.0f, 1.0f);
	glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_BYTE, indices + 24);
	
	glNormal3f(0.0f, -1.0f, 0.0f);
	glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_BYTE, indices + 30);
}

GLfloat lightAmbient[] = { 0.2f, 0.2f, 0.2f, 1.0f };
GLfloat lightDiffuse[] = { 0.7f, 0.7f, 0.7f, 1.0f };
GLfloat lightSpecular[] = { 0.9f, 0.9f, 0.9f };
GLfloat materialColor[] = { 0.8f, 0.0f, 0.0f };

void setup_lighting(void) {
	glEnable(GL_DEPTH_TEST);
	glDepthFunc(GL_LEQUAL);
	glEnable(GL_COLOR_MATERIAL);
	
	glLightfv(GL_LIGHT0, GL_POSITION, vLightPos);
	glLightfv(GL_LIGHT0, GL_AMBIENT, lightAmbient);
	glLightfv(GL_LIGHT0, GL_DIFFUSE, lightDiffuse);
	glLightfv(GL_LIGHT0, GL_SPECULAR, lightSpecular);
	glEnable(GL_LIGHTING);
	glEnable(GL_LIGHT0);
	glMaterialfv(GL_FRONT, GL_SPECULAR,lightSpecular);
	glMaterialfv(GL_FRONT, GL_AMBIENT_AND_DIFFUSE, materialColor);
	glMateriali(GL_FRONT, GL_SHININESS,128);
}

void render_scene(void) {
	printf("render scene: dist = %f\n",dist);
	
	glMatrixMode(GL_MODELVIEW);
	glLoadIdentity();

	// Clear the window with current clearing color
	glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
	glShadeModel(GL_SMOOTH);
	glEnable(GL_NORMALIZE);

	setup_lighting();
	
	// Set drawing color to Red
	glColor4f(1.0f, 0.0f, 0.0f, 1.0f);
	
	glTranslatef(0,0,-dist);
	glRotatef(30.0f, 1.0f, 0.0f, 0.0f);
	glRotatef(330.0f, 0.0f, 1.0f, 0.0f);
	
	
	glPushMatrix();
	glScalef(10.0, 10.0, 10.0);
	drawCube();
	glPopMatrix();
	
//	glFlush();
	glutSwapBuffers();

	lastFrameTime = t;

}

void ChangeSize(int w, int h) {
	printf("ChangeSize: w=%d, h=%d\n",w,h);
	
	// Calculate new clipping volume
	
	// Set the viewport to be the entire window
	//glViewport(0, 0, w, h);
	
	//makeViewportMatrix(viewportMatrix,0,0,w,h);
	
	GLfloat aspectRatio;
	
	glMatrixMode(GL_PROJECTION);
	glLoadIdentity();

	
	aspectRatio = (GLfloat)w / (GLfloat)h;
	
#if 0	
	printf("w = %d, h = %d, Aspect ratio is %f\n", w, h, aspectRatio);
	if (w <= h) {
		printf("left=%f, right=%f, bottom=%f, top=%f, near=%f, far=%f\n", -100.0, 100.0, -100.0 / aspectRatio, 100.0 / aspectRatio, -200.0f, 200.0f);
		glOrtho( -100.0, 100.0, -100.0 / aspectRatio, 100.0 / aspectRatio, -200.0f, 200.0f);
	} else {
		printf("left=%f, right=%f, bottom=%f, top=%f, near=%f, far=%f\n", -100.0 * aspectRatio, 100.0 * aspectRatio, -100.0, 100.0, -200.0f, 200.0f);
		glOrtho( -100.0 * aspectRatio, 100.0 * aspectRatio, -100.0, 100.0, -200.0f, 200.0f);
	}
#else	

#define DEGREES_TO_RADIANS(__ANGLE__) ((__ANGLE__) / 180.0 * M_PI)


	const GLfloat zNear = 0.01, 
	zFar = 1000.0, 
	fieldOfView = 45.0; 
	GLfloat size; 
	glEnable(GL_DEPTH_TEST); // Enables Depth Testing 
	//Set the OpenGL projection matrix 
	glMatrixMode(GL_PROJECTION); 
	size = zNear * tanf(DEGREES_TO_RADIANS(fieldOfView) / 2.0); 
	glFrustum(-size, size, -size / (w / h), size / 
			   (w / h), zNear, zFar); 
	glViewport(0, 0, w, h); 

#endif
	
	
	glMatrixMode(GL_MODELVIEW);
	glLoadIdentity();

}

void update_animation() {
	printf("Updating animation\n");
	double deltaTime = t - lastFrameTime;
	static double delta = 5;
	dist = dist + delta;
	if (dist > 500)
		delta = -5;
	if (dist < 20)
		delta = +5;
}

void idle_handler() {
	gettimeofday(&now,NULL);
	t = (double)(now.tv_sec - start_time.tv_sec) + ((double)(now.tv_usec - start_time.tv_usec) / 1000000);
	
	if (t - lastFrameTime >= frameInterval) {
		update_animation();
		glutPostRedisplay();
	}
}


void setup_rc(void) {
	glClearColor(0.0f, 0.0f, 0.0f, 1.0f);
}

int main (int argc, char ** argv) {
	glutInit(&argc,argv);
	glutInitDisplayMode(GLUT_DOUBLE | GLUT_RGBA | GLUT_DEPTH);
	glutInitWindowSize(640, 480);
	glutCreateWindow("Projection Test");
	glutReshapeFunc(ChangeSize);
	glutDisplayFunc(render_scene);
	glutIdleFunc(idle_handler);
	setup_rc();
	
	gettimeofday(&start_time,NULL);

	frameRate = 50.0;
	frameInterval = 1/frameRate;

	glutMainLoop();
    return 0;
}
