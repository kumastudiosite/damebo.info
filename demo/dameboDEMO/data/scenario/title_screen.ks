[_tb_system_call storage=system/_title_screen.ks]

[hidemenubutton]

[tb_clear_images]

[tb_keyconfig  flag="0"  ]
[tb_hide_message_window  ]
[bg  storage="title.jpg"  ]
[tb_image_show  time="300"  storage="default/title.png"  width="731"  height="125"  x="117"  y="155"  _clickable_img=""  ]
*title

[glink  color="black"  text="デモを始める"  x="380"  y="333"  size="24"  target="*start"  width=""  height=""  _clickable_img=""  ]
[s  ]
*start

[cm  ]
[tb_keyconfig  flag="1"  ]
[jump  storage="scene1.ks"  target=""  ]
[s  ]
*load

[cm  ]
[showload]

[jump  target="*title"  storage=""  ]
[s  ]
