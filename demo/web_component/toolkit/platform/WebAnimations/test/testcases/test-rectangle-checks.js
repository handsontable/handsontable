check(document.querySelectorAll('#test')[0],{'clip':'rect(300px 400px 300px 400px)'},0);
check(document.querySelectorAll('#test')[0],{'clip':'rect(240px 480px 360px 320px)'},0.2);
check(document.querySelectorAll('#test')[0],{'clip':'rect(180px 560px 420px 240px)'},0.4);
check(document.querySelectorAll('#test')[0],{'clip':'rect(120px 640px 480px 160px)'},0.6000000000000001);
check(document.querySelectorAll('#test')[0],{'clip':'rect(60px 720px 540px 80px)'},0.8);
check(document.querySelectorAll('#test')[0],{'clip':'rect(0px 800px 600px 0px)'},1);
check(document.querySelectorAll('#test')[0],{'clip':'rect(0px 800px 600px 0px)'},1.2);
